variable "environment" {
  description = "Environment name, e.g. staging or prod. Part of every resource name."
  type        = string
}

variable "app_name" {
  description = "Prefix for resource names."
  type        = string
  default     = "tvet-portal"
}

variable "region" {
  description = "Same region as the buckets, so data stays in South Africa."
  type        = string
  default     = "af-south-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}

# --- Application ---

variable "image_tag" {
  description = "Tag of the image in ECR to run. Deploy a new version by applying with a new tag."
  type        = string
}

variable "ingestion_bucket" {
  description = "Landing bucket the app reads Parquet submissions from."
  type        = string
}

variable "approved_bucket" {
  description = "Bucket the app writes approved rows to."
  type        = string
}

variable "hosted_zone_name" {
  description = "Public Route 53 zone in this account that the portal's name lives in."
  type        = string
  default     = "tvet-portal.co.za"
}

variable "domain_name" {
  description = <<-EOT
    The portal's address, e.g. staging.tvet-portal.co.za. Terraform issues its certificate and
    points it at the load balancer. Leave empty to serve plain HTTP on the load balancer's own
    name, but then sign-in won't work: the session cookie is Secure in production.
  EOT
  type        = string
  default     = ""
}

variable "task_cpu" {
  description = "Fargate CPU units (1024 = 1 vCPU)."
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = "Fargate memory in MiB. Whole tables are loaded into memory, so keep this generous."
  type        = number
  default     = 4096
}

variable "log_retention_days" {
  type    = number
  default = 90
}

# --- Database ---

variable "db_instance_class" {
  type    = string
  default = "db.t4g.small"
}

variable "db_allocated_storage" {
  description = "Initial storage in GiB. Grows automatically up to db_max_allocated_storage."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  type    = number
  default = 100
}

variable "db_multi_az" {
  description = "A standby in a second Availability Zone. Worth it for prod, not for the pilot."
  type        = bool
  default     = false
}

variable "db_backup_retention_days" {
  type    = number
  default = 7
}

variable "deletion_protection" {
  description = "Blocks deleting the database and load balancer. Turn off only to tear an environment down."
  type        = bool
  default     = true
}
