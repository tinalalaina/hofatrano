from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0004_userprofile_is_certified"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="phone2",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="phone3",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="whatsapp_phone",
            field=models.CharField(blank=True, max_length=32),
        ),
    ]
