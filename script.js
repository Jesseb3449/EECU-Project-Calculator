const taxBtn = document.getElementById('tax-btn');
const monthlyBtn = document.getElementById('monthly-btn');

function toggleTax() {
    const table = document.getElementById('dropdown');
    if (table.style.display === 'none' || table.style.display === '') {
        table.style.display = 'flex';
    } else {        table.style.display = 'none';
    }
}

function toggleMonthlyBudget() {
    const form = document.getElementById('input-DropDown');
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'flex';
    } else {        form.style.display = 'none';
    }
}
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
    const netMonth = (grossSalary - totalDeductions) / 12;

 
    updateTable(medicare, socialSecurity, federalTax, stateTax, netPay, netMonth);
});

function updateTable(med, ss, fed, state, net, month) {
    const format = (num) => `$${num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    document.getElementById('medicare-val').textContent = format(med);
    document.getElementById('ss-val').textContent = format(ss);
    document.getElementById('fed-val').textContent = format(fed);
    document.getElementById('state-val').textContent = format(state);
    document.getElementById('net-pay-val').textContent = format(net);
    document.getElementById('net-monthly-val').textContent = format(month);
}

function resetTable() {
    updateTable(0, 0, 0, 0, 0, 0);
}

// Load Chart.js
const chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
chartScript.onload = () => initChart();
document.head.appendChild(chartScript);

let budgetChart = null;

function saveInputs() {
  document.querySelectorAll('.budget-input').forEach(input => {
    localStorage.setItem(input.id, input.value);
  });
}

function loadInputs() {
  document.querySelectorAll('.budget-input').forEach(input => {
    const saved = localStorage.getItem(input.id);
    if (saved !== null) input.value = saved;
  });
  updateChart();
}

function initChart() {
  const ctx = document.getElementById('budgetChart').getContext('2d');
  budgetChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Housing', 'Education', 'Essentials', 'Future Proofing', 'Life Style', 'Remaining'],
      datasets: [{
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: ['#004999', '#237f2b', '#e07b00', '#9b2335', '#5a2d82', '#d0d0d0'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed;
              return ` $${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            }
          }
        }
      }
    }
  });

  // Listen to all budget inputs — now also saves on each change
  document.querySelectorAll('.budget-input').forEach(input => {
    input.addEventListener('input', () => {
      saveInputs();
      updateChart();
    });
  });

  // Restore saved values on load
  loadInputs();
}

function getInputVal(id) {
  return parseFloat(document.getElementById(id)?.value) || 0;
}

function updateChart() {
  if (!budgetChart) return;

  const netMonthlyEl = document.getElementById('net-monthly-val');
  const netMonthly = parseFloat(netMonthlyEl?.textContent?.replace(/[$,]/g, '')) || 0;

  const subtitle = document.getElementById('chart-subtitle');

  const housing = getInputVal('rent-mortgage-val') + getInputVal('insurance-val');
  const education = getInputVal('loan-payments-val') + getInputVal('supplies-val');
  const essentials = getInputVal('phone-val') + getInputVal('ess-insurance-val') + getInputVal('groceries-val') + getInputVal('clothes-val');
  const futureProofing = getInputVal('401k-val') + getInputVal('investments-val');
  const lifeStyle = getInputVal('dining-val') + getInputVal('gym-val') + getInputVal('streaming-val') + getInputVal('personal-val');

  const totalSpent = housing + education + essentials + futureProofing + lifeStyle;
  updateProgressBar(totalSpent, netMonthly);

  if (netMonthly === 0) {
    subtitle.textContent = 'Select a career to get started';
    subtitle.className = '';
    return;
  }

  const remaining = netMonthly - totalSpent;

  budgetChart.data.datasets[0].data = [
    housing, education, essentials, futureProofing, lifeStyle,
    Math.max(0, remaining)
  ];
  budgetChart.update();

  if (remaining < 0) {
    subtitle.textContent = `Over budget by $${Math.abs(remaining).toFixed(2)}`;
    subtitle.className = 'negative';
  } else {
    subtitle.textContent = `$${remaining.toFixed(2)} remaining of $${netMonthly.toFixed(2)}`;
    subtitle.className = 'positive';
  }
}

function updateProgressBar(totalSpent, netMonthly) {
  const fill = document.getElementById('progress-fill');
  if (!fill) return;
  const pct = netMonthly > 0 ? Math.min((totalSpent / netMonthly) * 100, 100) : 0;
  fill.style.width = pct + '%';
}