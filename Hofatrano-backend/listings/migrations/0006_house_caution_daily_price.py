from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0005_house_contact_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="house",
            name="caution_amount",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="house",
            name="daily_reservation_price",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
