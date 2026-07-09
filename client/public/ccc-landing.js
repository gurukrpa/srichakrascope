/* ── FAQ Accordion ─────────────────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var item = btn.closest('.faq-item');
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function(el) {
      el.classList.remove('open');
      el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ── Registration Form → WhatsApp ──────────────────────────── */
document.getElementById('cccForm').addEventListener('submit', function(e) {
  e.preventDefault();

  var name  = document.getElementById('name').value.trim();
  var phone = document.getElementById('phone').value.trim().replace(/\D/g, '');
  var role  = document.getElementById('role').value;
  var city  = document.getElementById('city').value.trim();

  if (!name || !phone || !role || !city) {
    alert('Please fill in all fields before submitting.');
    return;
  }
  if (phone.length < 10) {
    alert('Please enter a valid 10-digit WhatsApp number.');
    return;
  }

  var roleLabels = {
    teacher:    'Teacher / School Staff',
    psychology: 'Psychology / Education Graduate',
    parent:     'Parent',
    hr:         'HR / Corporate Professional',
    school:     'School Management / Principal',
    other:      'Other'
  };

  var message = encodeURIComponent(
    'Hi! I\'d like to register for the Career Counsellor Certification Program.\n\n' +
    'Name: ' + name + '\n' +
    'Phone: ' + phone + '\n' +
    'I am a: ' + (roleLabels[role] || role) + '\n' +
    'City: ' + city + '\n\n' +
    'Batch starts June 11, 2026 (₹999 blocks your seat). Please share payment details to confirm my seat. \uD83D\uDE4F'
  );

  window.open('https://wa.me/918590396662?text=' + message, '_blank', 'noopener,noreferrer');
});
