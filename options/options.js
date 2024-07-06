
// Saves options to chrome.storage
const saveOptions = () => {
    const showProgressBar = document.getElementById('showprogressbar').checked;
  
    chrome.storage.sync.set(
      { showProgressBar: showProgressBar },
      () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
          status.textContent = '';
        }, 750);
      }
    );
  };
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  const restoreOptions = () => {
    chrome.storage.sync.get(
      { showProgressBar: true },
      (items) => {
        document.getElementById('showprogressbar').checked = items.showProgressBar;
      }
    );
  };
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);