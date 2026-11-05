locals {
  name           = "${var.app_name}-${var.environment}"
  container_name = "portal"
  container_port = 4000
  https          = var.domain_name != ""
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
