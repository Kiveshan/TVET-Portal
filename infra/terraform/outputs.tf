output "url" {
  description = "Point the portal's DNS name (CNAME or alias) at this."
  value       = "${local.https ? "https" : "http"}://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "service_name" {
  value = aws_ecs_service.app.name
}

output "log_group" {
  value = aws_cloudwatch_log_group.app.name
}

output "db_endpoint" {
  value = aws_db_instance.main.address
}

output "task_role_arn" {
  description = "Give this role access in the bucket policies if the buckets are in another account."
  value       = aws_iam_role.task.arn
}

output "migrate_command" {
  description = "Runs prisma migrate deploy as a one-off task from the current image. Run after each apply that changes image_tag."
  value = join(" ", [
    "aws ecs run-task --region ${var.region}",
    "--cluster ${aws_ecs_cluster.main.name}",
    "--task-definition ${aws_ecs_task_definition.app.arn}",
    "--launch-type FARGATE",
    "--network-configuration 'awsvpcConfiguration={subnets=[${join(",", aws_subnet.public[*].id)}],securityGroups=[${aws_security_group.app.id}],assignPublicIp=ENABLED}'",
    "--overrides '{\"containerOverrides\":[{\"name\":\"${local.container_name}\",\"command\":[\"npx\",\"prisma\",\"migrate\",\"deploy\"]}]}'",
  ])
}
