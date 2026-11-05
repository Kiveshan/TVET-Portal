resource "aws_ecr_repository" "app" {
  name                 = local.name
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last 30 images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 30 }
      action       = { type = "expire" }
    }]
  })
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${local.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_ecs_cluster" "main" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = local.name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  # NODE_ENV, PORT, STATIC_DIR and TRUST_PROXY are set in the image.
  container_definitions = jsonencode([{
    name         = local.container_name
    image        = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"
    essential    = true
    portMappings = [{ containerPort = local.container_port, protocol = "tcp" }]

    environment = [
      { name = "AWS_REGION", value = var.region },
      { name = "INGESTION_BUCKET", value = var.ingestion_bucket },
      { name = "APPROVED_BUCKET", value = var.approved_bucket },
    ]

    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.database_url.arn },
      { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt_secret.arn },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app.name
        awslogs-region        = var.region
        awslogs-stream-prefix = "portal"
      }
    }
  }])

  depends_on = [aws_secretsmanager_secret_version.database_url, aws_secretsmanager_secret_version.jwt_secret]
}

resource "aws_ecs_service" "app" {
  name            = "portal"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  launch_type     = "FARGATE"
  # Exactly one: the table cache and rate-limit counters live in memory. Scaling out needs
  # the phase 2 changes first. During a deploy the old and new task overlap briefly.
  desired_count                      = 1
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = local.container_name
    container_port   = local.container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.http, aws_lb_listener.https]
}
