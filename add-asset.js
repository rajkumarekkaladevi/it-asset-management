document.getElementById('assetForm')
.addEventListener('submit', async (e) => {

    e.preventDefault();

    const asset = {
        asset_tag: document.getElementById('asset_tag').value,
        asset_type: document.getElementById('asset_type').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        serial_number: document.getElementById('serial_number').value,
        purchase_date: document.getElementById('purchase_date').value,
        warranty_end: document.getElementById('warranty_end').value,
        status: document.getElementById('status').value,
        assigned_to: document.getElementById('assigned_to').value
    };

    const response = await fetch(
        'http://localhost:3000/assets',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(asset)
        }
    );

    const data = await response.json();

    alert('Asset Added Successfully');
    console.log(data);
});