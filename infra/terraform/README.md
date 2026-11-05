# Hosting (phase 1)

One portal container on ECS Fargate behind a load balancer, with RDS for PostgreSQL, in af-south-1.
Express serves both the React app and `/api`, so the site and API share one origin.

| File | What it creates |
| --- | --- |
| `network.tf` | VPC across two AZs, public subnets (load balancer, task), private subnets (database), S3 gateway endpoint, security groups. No NAT gateway. |
| `alb.tf` | Application Load Balancer. HTTPS when `certificate_arn` is set, with port 80 redirecting. |
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

2. **Certificate.** Request one in ACM (af-south-1) for the portal's domain and set `certificate_arn` in `environments/staging.tfvars`. Without it the portal serves plain HTTP, and sign-in fails because the session cookie is `Secure`.

3. **Bucket access.** The task role grants the app access from its side. If the landing or approved bucket is in a different AWS account, that bucket's policy must also allow the `task_role_arn` output.

## Deploying

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

The service starts before the migrations finish, so the first sign-in can fail for a minute. Every later deploy is the same build, push, apply with the new tag, and migrate. Tags are immutable, so each commit needs its own.

**Never run `prisma db seed` against a hosted database.** It creates logins with passwords written in the repo. Create the first System Admin by hand instead.

## Not covered yet

- A GitHub Actions deploy job (build, push, apply, migrate) using OIDC instead of access keys.
- AWS WAF on the load balancer.
- CloudTrail S3 data events on both buckets, which POPIA audits will expect.
- A DNS record. Point the portal's domain at the `url` output.
