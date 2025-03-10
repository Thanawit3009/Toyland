# Generated by Django 5.1.2 on 2025-02-02 19:44

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_customuser_profile_picture"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="date_joined",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
