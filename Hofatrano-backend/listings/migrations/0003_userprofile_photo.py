from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0002_userprofile_tax_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="photo",
            field=models.ImageField(blank=True, null=True, upload_to="profile/"),
        ),
    ]
