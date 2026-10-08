// Toast notification utility
export const showToast = (message, type = 'success') => {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toastId = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toast);

  // Initialize and show toast using Bootstrap
  const bootstrap = require('bootstrap');
  const toastInstance = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 3000,
  });

  toastInstance.show();

  // Remove toast element after it's hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
};

