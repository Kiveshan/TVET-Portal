data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

# --- Execution role: used by ECS to pull the image, write logs and inject secrets ---

resource "aws_iam_role" "execution" {
  name               = "${local.name}-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "execution_secrets" {
  statement {
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.database_url.arn,
      aws_secretsmanager_secret.jwt_secret.arn,
    ]
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "read-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

# --- Task role: what the app itself can do. Only the calls it makes, on only the two buckets. ---

resource "aws_iam_role" "task" {
  name               = "${local.name}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

data "aws_iam_policy_document" "task_s3" {
  statement {
    sid       = "ListLanding"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.ingestion_bucket}"]
  }

  statement {
    sid       = "ReadLanding"
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::${var.ingestion_bucket}/*"]
  }

  # Write only: the app never reads back, overwrites on purpose, or deletes approved data.
  statement {
    sid       = "WriteApproved"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::${var.approved_bucket}/*"]
  }
}

resource "aws_iam_role_policy" "task_s3" {
  name   = "s3-access"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task_s3.json
}
