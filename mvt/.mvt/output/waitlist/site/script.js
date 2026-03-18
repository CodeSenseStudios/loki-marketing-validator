const headlineVariants = ["Stop guessing if Untitled Opportunity has demand","Validate demand before you build the wrong thing","Turn Pain point: Teams confuse enthusiasm with real demand into a clear go/no-go signal"];
const form = document.querySelector('#waitlist-form');
const counter = document.querySelector('#counter');
const referralInput = document.querySelector('#referral-link');
const headline = document.querySelector('h1');
const params = new URLSearchParams(window.location.search);
const variantKey = 'mvt-headline-variant';
const existingVariant = localStorage.getItem(variantKey);
const chosenVariant = existingVariant || headlineVariants[Math.floor(Math.random() * headlineVariants.length)];
localStorage.setItem(variantKey, chosenVariant);
if (headline) headline.textContent = chosenVariant;
if (counter) counter.textContent = localStorage.getItem('mvt-signups') || '0';
if (referralInput) {
  const referralCode = params.get('ref') || crypto.randomUUID().slice(0, 8);
  referralInput.value = window.location.origin + window.location.pathname.replace('thanks.html', 'index.html') + '?ref=' + referralCode;
}
function fireEvent(name, detail) { console.log('GA4', name, detail); }
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#email').value.trim();
    if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(email)) {
      alert('Enter a valid email address.');
      return;
    }
    const payload = {
      email,
      variant: chosenVariant,
      referral_code: params.get('ref') || '',
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || ''
    };
    fireEvent('waitlist_signup', payload);
    const signups = Number(localStorage.getItem('mvt-signups') || '0') + 1;
    localStorage.setItem('mvt-signups', String(signups));
    window.location.href = './thanks.html';
  });
}
document.querySelectorAll('[data-share]').forEach((button) => {
  button.addEventListener('click', () => {
    fireEvent('referral_share', { channel: button.getAttribute('data-share') });
  });
});