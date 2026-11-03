variable "aws_region" {
  type        = string
  description = "Target AWS deployment region for compute and networking resources"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Deployment lifecycle environment name (e.g., development, staging, production)"
  default     = "production"
}

variable "project_name" {
  type        = string
  description = "Project taxonomy identifier for resource tagging and isolation"
  default     = "cnad-ca2-devops"
}

variable "vpc_cidr" {
  type        = string
  description = "IPv4 CIDR block allocation for the custom Virtual Private Cloud (VPC)"
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type        = string
  description = "IPv4 CIDR block allocation for the public frontend subnet"
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  type        = string
  description = "AWS Availability Zone for compute subnet placement"
  default     = "us-east-1a"
}

variable "instance_type" {
  type        = string
  description = "AWS EC2 virtual hardware instance profile"
  default     = "t3.micro"
}

variable "ami_id" {
  type        = string
  description = "Base Amazon Machine Image (AMI) ID (Ubuntu Server 22.04 LTS x86_64 in us-east-1)"
  default     = "ami-0c7217cdde317cfec"
}

variable "app_port" {
  type        = number
  description = "Ingress TCP port exposed by the Node.js CloudOps application"
  default     = 3000
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "Authorized IPv4 CIDR range permitted to establish SSH ingress sessions"
  default     = "0.0.0.0/0"
}

variable "key_name" {
  type        = string
  description = "Optional AWS EC2 key pair name for administrative SSH key-based access"
  default     = ""
}

