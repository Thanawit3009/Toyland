# Generated by Django 5.1.2 on 2025-02-04 05:11

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("community", "0007_auto_20250203_2359"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="like",
            unique_together={("user", "post")},
        ),
    ]
