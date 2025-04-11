
const FILE_SERVICE_URL = 'https://52.55.96.19';
const MAIL_SERVICE_URL = 'https://18.183.255.158';


const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const filesList = document.getElementById('filesList');
const emailsList = document.getElementById('emailsList');
const filterBtn = document.getElementById('filterBtn');
const showAllBtn = document.getElementById('showAllBtn');
const emailForm = document.getElementById('emailForm');
const uploadForm = document.getElementById('uploadForm');
const searchEmailsBtn = document.getElementById('searchEmailsBtn');
const filesLoading = document.getElementById('filesLoading');
const emailsLoading = document.getElementById('emailsLoading');
const attachFilesBtn = document.getElementById('attachFilesBtn');
const fileSelectionModal = document.getElementById('fileSelectionModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalFilesList = document.getElementById('modalFilesList');
const confirmAttachBtn = document.getElementById('confirmAttachBtn');
const selectedFilesContainer = document.getElementById('selectedFilesContainer');


let selectedAttachmentFiles = [];


tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabId = button.dataset.tab;
    
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    
    tabContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === tabId) {
        content.classList.add('active');
      }
    });
    
    
    if (tabId === 'files') {
      loadAllFiles();
    } else if (tabId === 'emails') {
      loadEmails();
    }
  });
});


async function loadFiles(folder = '', fileType = '') {
  try {
    filesLoading.style.display = 'block';
    filesList.innerHTML = '';
    
    let url = `${FILE_SERVICE_URL}/list-files`;
    const params = new URLSearchParams();
    
    if (folder) params.append('folder', folder);
    if (fileType) params.append('fileType', fileType);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const files = await response.json();
    
    if (files.length === 0) {
      filesList.innerHTML = '<div class="empty-state">No files found.</div>';
    } else {
      renderFiles(files);
    }
  } catch (error) {
    console.error('Error loading files:', error);
    filesList.innerHTML = `<div class="error-state">Error loading files: ${error.message}</div>`;
  } finally {
    filesLoading.style.display = 'none';
  }
}

function renderFiles(files) {
  filesList.innerHTML = '';
  
  files.forEach(file => {
    const fileName = file.key.split('/').pop() || file.key;
    const fileSize = formatFileSize(file.size);
    const lastModified = new Date(file.lastModified).toLocaleString();
    
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    fileElement.innerHTML = `
      <div class="file-name">${fileName}</div>
      <div class="file-info">Size: ${fileSize} • Modified: ${lastModified}</div>
      <div class="file-path">Path: ${file.key}</div>
      <div class="file-actions">
        <a href="${file.url}" target="_blank" class="action-btn">View</a>
        <a href="${file.url}" download class="action-btn">Download</a>
        <button class="delete-btn" data-key="${encodeURIComponent(file.key)}">Delete</button>
      </div>
    `;
    
    
    const deleteBtn = fileElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to delete ${fileName}?`)) {
        try {
          const key = deleteBtn.dataset.key;
          await deleteFile(key);
          fileElement.remove();
        } catch (error) {
          alert(`Error deleting file: ${error.message}`);
        }
      }
    });
    
    filesList.appendChild(fileElement);
  });
}


function renderModalFiles(files) {
  modalFilesList.innerHTML = '';
  
  files.forEach(file => {
    const fileName = file.key.split('/').pop() || file.key;
    const fileSize = formatFileSize(file.size);
    
    const fileElement = document.createElement('div');
    fileElement.className = 'modal-file-item';
    const isSelected = selectedAttachmentFiles.some(f => f.key === file.key);
    
    fileElement.innerHTML = `
      <div class="file-checkbox">
        <input type="checkbox" id="file-${file.key}" ${isSelected ? 'checked' : ''}>
      </div>
      <div class="file-details">
        <div class="file-name">${fileName}</div>
        <div class="file-info">Size: ${fileSize}</div>
      </div>
    `;
    
    
    const checkbox = fileElement.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        
        if (!selectedAttachmentFiles.some(f => f.key === file.key)) {
          selectedAttachmentFiles.push(file);
        }
      } else {
        
        selectedAttachmentFiles = selectedAttachmentFiles.filter(f => f.key !== file.key);
      }
    });
    
    modalFilesList.appendChild(fileElement);
  });
}


function updateSelectedFilesDisplay() {
  selectedFilesContainer.innerHTML = '';
  
  if (selectedAttachmentFiles.length === 0) {
    selectedFilesContainer.innerHTML = '<div class="no-files">No files selected</div>';
    return;
  }
  
  selectedAttachmentFiles.forEach(file => {
    const fileName = file.key.split('/').pop() || file.key;
    
    const fileTag = document.createElement('div');
    fileTag.className = 'selected-file-tag';
    fileTag.innerHTML = `
      <span>${fileName}</span>
      <button class="remove-file" data-key="${file.key}">×</button>
    `;
    
    
    const removeBtn = fileTag.querySelector('.remove-file');
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      selectedAttachmentFiles = selectedAttachmentFiles.filter(f => f.key !== file.key);
      updateSelectedFilesDisplay();
    });
    
    selectedFilesContainer.appendChild(fileTag);
  });
}

async function deleteFile(key) {
  try {
    const response = await fetch(`${FILE_SERVICE_URL}/delete/${key}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

async function uploadFile(formData) {
  try {
    const response = await fetch(`${FILE_SERVICE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function loadAllFiles() {
  try {
    filesLoading.style.display = 'block';
    filesList.innerHTML = '';
    
    const response = await fetch(`${FILE_SERVICE_URL}/retrieve-files`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const files = await response.json();
    
    if (files.length === 0) {
      filesList.innerHTML = '<div class="empty-state">No files found.</div>';
    } else {
      renderFiles(files);
    }
  } catch (error) {
    console.error('Error loading files:', error);
    filesList.innerHTML = `<div class="error-state">Error loading files: ${error.message}</div>`;
  } finally {
    filesLoading.style.display = 'none';
  }
}


async function sendEmail(emailData) {
  try {
    const response = await fetch(`${MAIL_SERVICE_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function loadEmails(search = '') {
  try {
    emailsLoading.style.display = 'block';
    emailsList.innerHTML = '';
    
    let url = `${MAIL_SERVICE_URL}/emails`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const emails = await response.json();
    
    if (emails.length === 0) {
      emailsList.innerHTML = '<div class="empty-state">No emails found.</div>';
    } else {
      renderEmails(emails);
    }
  } catch (error) {
    console.error('Error loading emails:', error);
    emailsList.innerHTML = `<div class="error-state">Error loading emails: ${error.message}</div>`;
  } finally {
    emailsLoading.style.display = 'none';
  }
}

function renderEmails(emails) {
  emailsList.innerHTML = '';
  
  emails.forEach(email => {
    const date = new Date(email.timestamp).toLocaleString();
    
    const emailElement = document.createElement('div');
    emailElement.className = 'email-item';
    
    
    let attachmentsHtml = '';
    if (email.attachments && email.attachments.length > 0) {
      attachmentsHtml = `
        <div class="email-attachments">
          <strong>Attachments:</strong>
          <ul>
            ${email.attachments.map(att => `<li>${att.filename} (${formatFileSize(att.size)})</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    emailElement.innerHTML = `
      <div class="email-header">
        <div class="email-to">To: ${email.to}</div>
        <div class="email-date">${date}</div>
      </div>
      <div class="email-subject">Subject: ${email.subject}</div>
      <div class="email-body">${email.body}</div>
      ${attachmentsHtml}
      <span class="email-toggle">Show more</span>
    `;
    
    const emailBody = emailElement.querySelector('.email-body');
    const emailToggle = emailElement.querySelector('.email-toggle');
    
    emailToggle.addEventListener('click', () => {
      emailBody.classList.toggle('expanded');
      emailToggle.textContent = emailBody.classList.contains('expanded') ? 'Show less' : 'Show more';
    });
    
    emailsList.appendChild(emailElement);
  });
}


function showFileSelectionModal() {
  
  fetch(`${FILE_SERVICE_URL}/retrieve-files`)
    .then(response => response.json())
    .then(files => {
      renderModalFiles(files);
      fileSelectionModal.style.display = 'flex';
    })
    .catch(error => {
      console.error('Error loading files for selection:', error);
      alert('Failed to load files. Please try again.');
    });
}


filterBtn.addEventListener('click', () => {
  const folder = document.getElementById('folder').value.trim();
  const fileType = document.getElementById('fileType').value.trim();
  loadFiles(folder, fileType);
});

showAllBtn.addEventListener('click', () => {
  document.getElementById('folder').value = '';
  document.getElementById('fileType').value = '';
  loadAllFiles();
});

attachFilesBtn.addEventListener('click', (e) => {
  e.preventDefault();
  showFileSelectionModal();
});


closeModalBtn.addEventListener('click', () => {
  fileSelectionModal.style.display = 'none';
});


confirmAttachBtn.addEventListener('click', () => {
  updateSelectedFilesDisplay();
  fileSelectionModal.style.display = 'none';
});


emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const to = document.getElementById('emailTo').value;
  const subject = document.getElementById('emailSubject').value;
  const body = document.getElementById('emailBody').value;
  const emailStatus = document.getElementById('emailStatus');
  
  try {
    emailStatus.className = 'status';
    emailStatus.textContent = 'Sending email...';
    

    const attachmentKeys = selectedAttachmentFiles.map(file => file.key);
    
    await sendEmail({ to, subject, body, attachmentKeys });
    
    emailStatus.textContent = 'Email sent successfully!';
    emailStatus.className = 'status success';
    
    
    emailForm.reset();
    selectedAttachmentFiles = [];
    updateSelectedFilesDisplay();
    
    
    loadEmails();
  } catch (error) {
    emailStatus.textContent = `Failed to send email: ${error.message}`;
    emailStatus.className = 'status error';
  }
});

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fileInput = document.getElementById('fileUpload');
  const folder = document.getElementById('uploadFolder').value.trim();
  const uploadStatus = document.getElementById('uploadStatus');
  
  if (!fileInput.files[0]) {
    uploadStatus.textContent = 'Please select a file to upload';
    uploadStatus.className = 'status error';
    return;
  }
  
  try {
    uploadStatus.className = 'status';
    uploadStatus.textContent = 'Uploading file...';
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    if (folder) {
      formData.append('folder', folder);
    }
    
    const result = await uploadFile(formData);
    
    uploadStatus.textContent = 'File uploaded successfully!';
    uploadStatus.className = 'status success';
    
    
    uploadForm.reset();
    
    
    loadAllFiles();
  } catch (error) {
    uploadStatus.textContent = `Failed to upload file: ${error.message}`;
    uploadStatus.className = 'status error';
  }
});

searchEmailsBtn.addEventListener('click', () => {
  const search = document.getElementById('emailSearch').value.trim();
  loadEmails(search);
});


window.addEventListener('click', (e) => {
  if (e.target === fileSelectionModal) {
    fileSelectionModal.style.display = 'none';
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAllFiles();
  updateSelectedFilesDisplay();
});
