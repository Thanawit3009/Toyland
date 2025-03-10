# Generated by Django 5.1.2 on 2025-02-09 19:21

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="chat_id",
            field=models.ForeignKey(
                default=None,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="messages",
                to="chat.chatroom",
            ),
            preserve_default=False,
        ),
    ]
