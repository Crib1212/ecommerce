export default async function handler(req, res) {
  // OPay will POST payment status here
  // Verify and update Google Sheet order
  console.log('OPay callback', req.body);
  return res.status(200).json({ status: 'received' });
}