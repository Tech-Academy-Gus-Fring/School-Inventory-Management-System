const { Equipment } = require('./models');

async function seed() {
  try {
    await Equipment.create({
      name: 'Dell Latitude 5420',
      type: 'Laptop',
      serial_number: 'DELL123456',
      condition: 'new',
      status: 'available',
      location: 'Room 201',
      quantity: 5
    });
    console.log('Test data added!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();