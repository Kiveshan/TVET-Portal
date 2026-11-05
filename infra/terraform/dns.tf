# The portal's name, its certificate, and the DNS records that validate the certificate and
# point the name at the load balancer. Only created when domain_name is set.

data "aws_route53_zone" "main" {
  count        = local.https ? 1 : 0
  name         = var.hosted_zone_name
  private_zone = false
}

resource "aws_acm_certificate" "portal" {
  count             = local.https ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.https ? {
    for option in aws_acm_certificate.portal[0].domain_validation_options : option.domain_name => option
  } : {}

  zone_id         = data.aws_route53_zone.main[0].zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

# Waits until ACM has seen the validation record and issued the certificate.
resource "aws_acm_certificate_validation" "portal" {
  count                   = local.https ? 1 : 0
  certificate_arn         = aws_acm_certificate.portal[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_route53_record" "portal" {
  count   = local.https ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
