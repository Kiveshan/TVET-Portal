resource "random_password" "db" {
  length = 32
  # Kept URL-safe, because the password goes inside DATABASE_URL.
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier     = local.name
  engine         = "postgres"
  engine_version = "17"
  instance_class = var.db_instance_class

  db_name  = "tvet"
  username = "tvet"
  password = random_password.db.result

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  # Encryption can only be chosen when the instance is created.
  storage_encrypted = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = var.db_multi_az

  backup_retention_period    = var.db_backup_retention_days
  copy_tags_to_snapshot      = true
  auto_minor_version_upgrade = true
  deletion_protection        = var.deletion_protection
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${local.name}-final"
}

# --- Secrets the task reads at start ---

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "${local.name}/database-url"
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  # sslmode=require: RDS only accepts TLS. node-postgres verifies the certificate against
  # the RDS CA bundle baked into the image (NODE_EXTRA_CA_CERTS).
  secret_string = "postgresql://${aws_db_instance.main.username}:${random_password.db.result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}?schema=public&sslmode=require"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${local.name}/jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt.result
}
