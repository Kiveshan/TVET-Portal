# Hosting (phase 1)

One portal container on ECS Fargate behind a load balancer, with RDS for PostgreSQL, in af-south-1.
Express serves both the React app and `/api`, so the site and API share one origin.

| File | What it creates |
| --- | --- |
| `network.tf` | VPC across two AZs, public subnets (load balancer, task), private subnets (database), S3 gateway endpoint, security groups. No NAT gateway. |
| `alb.tf` | Application Load Balancer. HTTPS when `domain_name` is set, with port 80 redirecting. |
| `dns.tf` | ACM certificate for `domain_name`, validated through the `tvet-portal.co.za` Route 53 zone, and an alias record pointing the name at the load balancer. |
| `database.tf` | RDS PostgreSQL 17 (encrypted, private), plus `DATABASE_URL` and `JWT_SECRET` in Secrets Manager. |
| `iam.tf` | Execution role (pull image, logs, secrets) and task role (list and read the landing bucket, write the approved bucket). |
| `ecs.tf` | ECR repository, log group, cluster, task definition and a one-task service. |

## Before the first apply

1. **State bucket.** Create it once, by hand, in the same account:

   ```bash
   aws s3api create-bucket --bucket <state-bucket> --region af-south-1 --create-bucket-configuration LocationConstraint=af-south-1
   aws s3api put-bucket-versioning --bucket <state-bucket> --versioning-configuration Status=Enabled
   aws s3api put-public-access-block --bucket <state-bucket> --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
   ```

   Put its name in `backend/staging.hcl`. The state holds the database password and JWT secret, so only the people who deploy should be able to read this bucket.

2. **Domain.** Set `domain_name` in the environment's tfvars (staging uses `staging.tvet-portal.co.za`). Terraform issues the certificate and creates the DNS records in the `tvet-portal.co.za` zone, which must be in the same account. Without a domain the portal serves plain HTTP, and sign-in fails because the session cookie is `Secure`.

3. **Bucket access.** The task role grants the app access from its side. If the landing or approved bucket is in a different AWS account, that bucket's policy must also allow the `task_role_arn` output.

## Setting up a new environment

```bash
cd infra/terraform
terraform init -backend-config=backend/staging.hcl
```

The service needs an image in ECR before it can start, so the first time create the repository on its own:

```bash
terraform apply -var-file=environments/staging.tfvars -var image_tag=bootstrap -target=aws_ecr_repository.app
```

Then build and push an image tagged with the commit, from the repository root:

```bash
REPO=$(terraform -chdir=infra/terraform output -raw ecr_repository_url)
TAG=$(git rev-parse --short HEAD)
aws ecr get-login-password --region af-south-1 | docker login --username AWS --password-stdin "${REPO%%/*}"
docker build -t "$REPO:$TAG" . && docker push "$REPO:$TAG"
```

Apply with that tag, then run the migrations:

```bash
terraform apply -var-file=environments/staging.tfvars -var image_tag=$TAG
eval "$(terraform output -raw migrate_command)"
```

The service starts before the migrations finish, so the first sign-in can fail for a minute.

On Windows, `docker login` to ECR can fail with "The stub received bad data", because the token is too long for the Windows credential store. Push through Docker Desktop's ECR helper instead: put `{"credHelpers": {"<registry>": "ecr-login"}}` in a temporary folder's `config.json`, set `DOCKER_CONFIG` to that folder and `AWS_PROFILE` to your profile, and skip `docker login`.

**The seed creates logins with passwords written in the repo.** Staging was seeded on purpose; change the `admin@` and `dhet@tvetportal.test` passwords before real data arrives. Don't seed prod.

## Deploying

Pushing to `staging` deploys automatically when `backend/`, `frontend/` or the Dockerfile change ([.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)). It can also be run by hand from the Actions tab. The workflow:

1. signs in to AWS as the `deploy_role_arn` role through GitHub's OIDC token, with no stored keys;
2. builds the image and pushes it to ECR, tagged with the short commit SHA;
3. registers a copy of the running task definition with only the image changed;
4. runs `prisma migrate deploy` from the new image, and stops if it fails, leaving the old version running;
5. rolls the service onto the new task definition, failing if the circuit breaker rolled it back;
6. checks `/api/health`.

The deploy role can only do those steps. Infrastructure changes still go through `terraform apply` by a person. Leave `image_tag` unset on those applies: Terraform then reads the image from the running service, so it keeps the deployed version instead of rolling it back.

## Not covered yet

- AWS WAF on the load balancer.
- CloudTrail S3 data events on both buckets, which POPIA audits will expect.
