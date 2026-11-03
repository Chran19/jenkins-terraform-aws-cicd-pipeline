output "vpc_id" {
  description = "Unique Identifier of the provisioned AWS Virtual Private Cloud"
  value       = aws_vpc.devops_vpc.id
}

output "subnet_id" {
  description = "Identifier of the public subnet hosting the EC2 compute instance"
  value       = aws_subnet.devops_subnet.id
}

output "security_group_id" {
  description = "Identifier of the application security group"
  value       = aws_security_group.app_sg.id
}

output "ec2_instance_id" {
  description = "AWS EC2 compute instance identifier"
  value       = aws_instance.app_server.id
}

output "ec2_public_ip" {
  description = "Public IPv4 address assigned to the EC2 compute instance"
  value       = aws_instance.app_server.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS hostname generated for the EC2 compute instance"
  value       = aws_instance.app_server.public_dns
}

output "app_url" {
  description = "Direct web browser URL to access the deployed CloudOps application"
  value       = "http://${aws_instance.app_server.public_ip}:${var.app_port}"
}
