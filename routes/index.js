var express = require("express");
var router = express.Router();
var moment = require("moment");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post('/api/calculate-emi', (req, res) => {
  const { bookingDate, checkinDate, amount, installmentType, downPayment, noOfEmi } = req.body;

  // Validate the input parameters
  if (!bookingDate || !checkinDate || !amount || !installmentType) {
    return res.status(400).json({ error: 'Invalid input parameters' });
  }

  const bookingDateObj = new Date(bookingDate);
  const checkinDateObj = new Date(checkinDate);

  if (isNaN(bookingDateObj) || isNaN(checkinDateObj)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  // Calculate the number of EMIs
  let noOfInstallments;
  if (noOfEmi) {
    noOfInstallments = noOfEmi;
  } else {
    const daysBetween = Math.ceil((checkinDateObj - bookingDateObj) / (1000 * 60 * 60 * 24));
    if (daysBetween < 30) {
      return res.status(400).json({ error: 'EMI not available' });
    }
    switch (installmentType) {
      case 'weekly':
        noOfInstallments = Math.ceil(daysBetween / 7);
        break;
      case 'biweekly':
        noOfInstallments = Math.ceil(daysBetween / 14);
        break;
      case 'monthly':
        noOfInstallments = Math.ceil(daysBetween / 30);
        break;
      default:
        return res.status(400).json({ error: 'Invalid installment type' });
    }
  }

  // Validate the EMI date and amount based on the test cases
  const emiList = [];
  const totalInstallmentAmount = amount - downPayment || 0;
  let emiAmount = totalInstallmentAmount / noOfInstallments;
  if (emiAmount < 5) {
    noOfInstallments = Math.ceil(totalInstallmentAmount / 5);
    emiAmount = totalInstallmentAmount / noOfInstallments;
  }

  let emiDate = new Date(bookingDateObj);
  for (let i = 0; i < noOfInstallments; i++) {
    const daysToCheckin = Math.ceil((checkinDateObj - emiDate) / (1000 * 60 * 60 * 24));
    if (daysToCheckin <= 14) {
      break;
    }
    emiList.push({ emi_date: emiDate.toISOString().substr(0, 10), amount: Math.round(emiAmount * 100) / 100 });
    emiDate.setDate(emiDate.getDate() + (installmentType === 'weekly' ? 7 : installmentType === 'biweekly' ? 14 : 30));
  }
  console.log(emiList)
  res.render('emi', { emi_available: true, data: emiList });

});

module.exports = router;
