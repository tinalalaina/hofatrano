from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0003_userprofile_photo"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="is_certified",
            field=models.BooleanField(default=False),
        ),
    ]
