
async function populateDropdown() {
    const dropdown = document.getElementById('career-dropdown');
    if (!dropdown) return console.error("Dropdown element not found!");

    try {
        const response = await fetch('https://eecu-data-server.vercel.app/data/2023');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("Success! Data looks like this:", data);

        // Check if data is actually an array
        const list = Array.isArray(data) ? data : data.results || [];

        list.forEach(item => {
            const option = document.createElement('option');
            option.value = item.Salary || item.salary || "";
            option.textContent = item.Occupation || item.occupation || "Unknown";
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

populateDropdown();


const careerDropdown = document.getElementById('career-dropdown');

careerDropdown.addEventListener('change', function() {
    const grossSalary = parseFloat(this.value);
    if (isNaN(grossSalary)) return resetTable();

    const standardDeduction = 16100;
    const taxableIncome = Math.max(0, grossSalary - standardDeduction);


    let federalTax = 0;
    if (taxableIncome > 50400) {
        federalTax += (taxableIncome - 50400) * 0.22; 
        federalTax += (50400 - 12400) * 0.12;         
        federalTax += 12400 * 0.10;                   
    } else if (taxableIncome > 12400) {
        federalTax += (taxableIncome - 12400) * 0.12; 
        federalTax += 12400 * 0.10;                   
    } else {
        federalTax += taxableIncome * 0.10;           
    }

  
    const medicare = grossSalary * 0.0145;
    const socialSecurity = grossSalary * 0.062;
    const stateTax = grossSalary * 0.04;

 
    const totalDeductions = federalTax + medicare + socialSecurity + stateTax;
    const netPay = grossSalary - totalDeductions;

 
    updateTable(medicare, socialSecurity, federalTax, stateTax, netPay);
});

function updateTable(med, ss, fed, state, net) {
    const format = (num) => `$${num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    document.getElementById('medicare-val').textContent = format(med);
    document.getElementById('ss-val').textContent = format(ss);
    document.getElementById('fed-val').textContent = format(fed);
    document.getElementById('state-val').textContent = format(state);
    document.getElementById('net-pay-val').textContent = format(net);
}

function resetTable() {
    updateTable(0, 0, 0, 0, 0);
}