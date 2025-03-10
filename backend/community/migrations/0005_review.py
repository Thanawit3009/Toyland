# Generated by Django 5.1.2 on 2025-02-03 10:07

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("community", "0004_comment_commentreply"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Review",
            fields=[
                ("review_id", models.AutoField(primary_key=True, serialize=False)),
                ("review_text", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "reviewed_user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reviews_received",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "reviewer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reviews_written",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
