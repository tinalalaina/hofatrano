from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0004_userprofile_is_certified"),
    ]

    operations = [
        migrations.AddField(
            model_name="house",
            name="owner_phone_1",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="house",
            name="owner_phone_2",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="house",
            name="owner_phone_3",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="house",
            name="owner_whatsapp",
            field=models.CharField(blank=True, max_length=32),
        ),
    ]
