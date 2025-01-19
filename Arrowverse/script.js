// Function to set a cookie
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Set cookie expiration in days
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get a cookie value
function getCookie(name) {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

// Function to delete a cookie (optional utility)
function deleteCookie(name) {
  setCookie(name, "", -1);
}

// Check the cookie value on page load
document.addEventListener('DOMContentLoaded', () => {
  const checkedCount = parseInt(getCookie('checkedCount')) || 0;

});

// Function to count checked checkboxes and update the cookie
function countCheckedCheckboxes() {
  const checkboxes = document.querySelectorAll('.checkbox-group');
  const checkedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;

  // Update the cookie with the current checked count
  setCookie('checkedCount', checkedCount, 999999); // Cookie valid for 7 days
  console.log(`Checked checkboxes: ${checkedCount}`);
}
document.addEventListener('DOMContentLoaded', () => {
    const checkedCount = parseInt(getCookie('checkedCount')) || 0;
    
    fetch('./data.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch JSON file');
        }
        return response.json();
      })
      .then((data) => {
        const episodes = data.Episodes;
        const repeatCount = episodes.length;
        const container = document.getElementById("content");
        let htmlContent = '';
  
        if (checkedCount === 0 || checkedCount === null) {
          // Generate the rows for all episodes when no checkboxes are checked
          for (let i = 0; i < repeatCount; i++) {
            const episode = episodes[i];
            htmlContent += `
              <div class="row w-100 align-items-center p-1 row-number-${i}">
                  <div class="col-sm-1 col-lg-1 border-end d-flex align-items-center">
                      <input class="form-check-input checkbox-group" type="checkbox" id="flexCheckDefault-${i}">
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex align-items-center">
                      <p class="mb-0">${episode.Series}</p>
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex align-items-center">
                      <p class="mb-0">S${episode.Season} E${episode.Episode}</p>
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex text-center align-items-center">
                      <p class="mb-0">${episode.Title}</p>
                  </div>
                  <div class="col-sm-2 col-lg-2 border-end d-flex align-items-center">
                      <button class="btn btn-primary" onclick="window.open('${data.Series[episode.Series]}', '_blank')">Watch</button>
                  </div>
              </div>
            `;
          }
        } else {
          // Generate the rows for checked episodes first
          for (let i = 0; i < checkedCount; i++) {
            const episode = episodes[i];
            htmlContent += `
              <div class="row w-100 align-items-center p-1 row-number-${i}">
                  <div class="col-sm-1 col-lg-1 border-end d-flex align-items-center">
                      <input class="form-check-input checkbox-group" type="checkbox" id="flexCheckChecked-${i}" checked>
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex align-items-center">
                      <p class="mb-0">${episode.Series}</p>
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex align-items-center">
                      <p class="mb-0">S${episode.Season} E${episode.Episode}</p>
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex text-center align-items-center">
                      <p class="mb-0">${episode.Title}</p>
                  </div>
                  <div class="col-sm-2 col-lg-2 border-end d-flex align-items-center">
                      <button class="btn btn-primary" onclick="window.open('${data.Series[episode.Series]}', '_blank')">Watch</button>
                  </div>
              </div>
            `;
          }
  
          // Generate the rows for unchecked episodes
          for (let j = checkedCount; j < repeatCount; j++) {
            const episode = episodes[j];
            htmlContent += `
              <div class="row w-100 align-items-center p-1 row-number-${j}">
                  <div class="col-sm-1 col-lg-1 border-end d-flex align-items-center">
                      <input class="form-check-input checkbox-group" type="checkbox" id="flexCheckDefault-${j}">
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex align-items-center">
                      <p class="mb-0">${episode.Series}</p>
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex align-items-center">
                      <p class="mb-0">S${episode.Season} E${episode.Episode}</p>
                  </div>
                  <div class="col-sm-3 col-lg-3 border-end d-flex text-center align-items-center">
                      <p class="mb-0">${episode.Title}</p>
                  </div>
                  <div class="col-sm-2 col-lg-2 border-end d-flex align-items-center">
                      <button class="btn btn-primary" onclick="window.open('${data.Series[episode.Series]}', '_blank')">Watch</button>
                  </div>
              </div>
            `;
          }
        }
  
        // Insert all generated HTML at once
        container.innerHTML = htmlContent;
  
        // Add event listeners to checkboxes
        const checkboxes = document.querySelectorAll('.checkbox-group');
        checkboxes.forEach(checkbox => {
          checkbox.addEventListener('click', countCheckedCheckboxes);
        });
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  });
  