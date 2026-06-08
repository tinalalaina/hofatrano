from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="tax_nif",
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="tax_stat",
            field=models.CharField(blank=True, max_length=64),
        ),
    ]
