# =========================================================
# NOTE: This file defines the core data models for the learning resource management system.
# 
# - Add na lang kayo ng ibang details (attributes), example sa files, dapat may Keywords, Authors, Year, Description, Learning Outcome, etc.
# - Pwede mag add ng attributes kung kinakailangan
# =========================================================



from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


# =========================================================
# USER MODEL
# =========================================================
class CustomUser(AbstractUser):
    """
    Represents all users in the system.

    Attributes:
        role        → Defines user responsibility (admin, teacher, etc.)
        department  → Used for grouping (e.g., BSIT, Grade 11)
    """

    ROLE_CHOICES = (
        ("super_admin", "Super Admin"),
        ("admin", "Administrator"),
        ("coordinator", "Coordinator"),
        ("teacher", "Teacher"),
        ("student", "Student"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        help_text="Defines the role of the user in the system"
    )

    department = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Used for grouping users (e.g., BSIT, Grade 11)"
    )


# =========================================================
# NODE (HIERARCHY)
# =========================================================
class Node(models.Model):
    """
    Dynamic hierarchical structure using Materialized Path.

    Purpose:
        Represents Institution → Program → Subject → Folder

    Example:
        CCS.BSIT.Programming 1

    Attributes:
        name    → Name of node (e.g., BSIT)
        parent  → Parent node (NULL if root)
        path    → Full path (auto-generated)
        depth   → Level in hierarchy (0=root)
        level   → Type of node (institution/program/subject)
    """

    name = models.CharField(
        max_length=100,
        help_text="Name of the node (e.g., BSIT, Grade 11)"
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        help_text="Parent node in hierarchy"
    )

    path = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Materialized path (e.g., CCS.BSIT)"
    )

    depth = models.IntegerField(
        default=0,
        db_index=True,
        help_text="Depth level (0=Institution, 1=Program, etc.)"
    )

    LEVEL_CHOICES = (
        ("institution", "Institution"),
        ("program", "Program/Grade"),
        ("subject", "Subject"),
        ("folder", "Custom Folder"),
    )

    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        help_text="Defines the hierarchy level type"
    )

    class Meta:
        unique_together = ("name", "parent")

    def clean(self):
        """
        Enforces valid hierarchy relationships.

        Example:
            Subject must be under Program
        """
        if self.parent:
            if self.level == "program" and self.parent.level != "institution":
                raise ValidationError("Program must be under Institution")

            if self.level == "subject" and self.parent.level != "program":
                raise ValidationError("Subject must be under Program")

    def save(self, *args, **kwargs):
        """
        Auto-generates path and depth.

        Example:
            Parent = CCS.BSIT
            Name = Programming 1

            Result:
                path = CCS.BSIT.Programming 1
                depth = 2
        """
        if self.parent:
            self.path = f"{self.parent.path}.{self.name}"
            self.depth = self.parent.depth + 1
        else:
            self.path = self.name
            self.depth = 0

        super().save(*args, **kwargs)

    def __str__(self):
        return self.path


# =========================================================
# RESOURCE
# =========================================================
class Resource(models.Model):
    """
    Represents a learning file stored in S3.

    Attributes:
        title           → Display name of file
        file_key        → S3 path reference
        file_type       → File format (pdf, docx, etc.)
        file_size       → Size in bytes
        owner           → Uploaded by (User)
        node            → Location in hierarchy
        access_level    → Visibility control
        status          → Approval status
        metadata        → Extra info (JSON)
    """

    ACCESS_CHOICES = (
        ("private", "Private"),
        ("public", "Public"),
        ("restricted", "Restricted"),
        ("mass", "Mass"),
    )

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    title = models.CharField(max_length=255, db_index=True)

    file_key = models.CharField(
        max_length=500,
        unique=True,
        help_text="Path in S3 bucket"
    )

    file_type = models.CharField(max_length=50)
    file_size = models.BigIntegerField()

    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    node = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        help_text="Hierarchy location"
    )

    access_level = models.CharField(max_length=20, choices=ACCESS_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Stores DepEd/CHED aligned data"
    )

    current_version = models.IntegerField(default=1)

    created_at = models.DateTimeField(default=timezone.now)


# =========================================================
# VERSION CONTROL
# =========================================================
class ResourceVersion(models.Model):
    """
    Stores historical versions of a file.
    """

    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    version_number = models.IntegerField()
    file_key = models.CharField(max_length=500)
    created_at = models.DateTimeField(default=timezone.now)


# =========================================================
# ACCESS CONTROL
# =========================================================
class ResourceAccess(models.Model):
    """
    Controls restricted access.

    Attributes:
        user        → Specific user access
        group_name  → Group-based access (e.g., BSIT)
    """

    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    group_name = models.CharField(max_length=100, null=True, blank=True)


# =========================================================
# ANALYTICS
# =========================================================
class ResourceAnalytics(models.Model):
    """
    Tracks user activity (view/download).
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    action = models.CharField(max_length=20)
    created_at = models.DateTimeField(default=timezone.now)


# =========================================================
# AUDIT LOG
# =========================================================
class AuditLog(models.Model):
    """
    Logs security-related actions.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)
    ip_address = models.GenericIPAddressField(null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
