// Prevent scroll restoration as early as possible
if('scrollRestoration' in history){
  history.scrollRestoration='manual';
}
// Immediately prevent scrolling
window.scrollTo(0,0);
document.documentElement.scrollTop=0;
if(document.body) document.body.scrollTop=0;
// Prevent scroll on beforeunload
window.addEventListener('beforeunload',function(){
  window.scrollTo(0,0);
});

document.addEventListener('DOMContentLoaded', function() {
      var transparentSearch = document.querySelector('.transparent-flight-search');
      // Auto-scroll for clear view of dropdown when user interacts with search
      (function initSearchAreaScroll() {
        var searchWrap = document.querySelector('.hero .home-flight-search-wrap');
        if (!searchWrap) return;
        var headerOffset = 96;
        var dropdownSpace = 360;
        function scrollForDropdownView() {
          var rect = searchWrap.getBoundingClientRect();
          if (rect.top < headerOffset) {
            var scrollTop = window.scrollY + rect.top - headerOffset;
            window.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
          } else if (rect.bottom + dropdownSpace > window.innerHeight) {
            var scrollBy = rect.bottom + dropdownSpace - window.innerHeight;
            window.scrollTo({ top: window.scrollY + scrollBy, behavior: 'smooth' });
          }
        }
        function onFieldFocus() {
          scrollForDropdownView();
          setTimeout(scrollForDropdownView, 160);
        }
const originInput = document.getElementById("transparent-txtOriginFull-home");
const destinationInput = document.getElementById("transparent-txtDestinationFull-home");

function getPageScrollTop() {
  return Math.max(
    window.pageYOffset || 0,
    document.documentElement ? document.documentElement.scrollTop || 0 : 0,
    document.body ? document.body.scrollTop || 0 : 0
  );
}

function scrollFieldIntoView(e) {
  if (!e || !e.target || typeof e.target.scrollIntoView !== "function") return;
  var target = e.target;
  target.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

if (originInput) {
  originInput.addEventListener("mousedown", function () {
    setTimeout(function () { scrollFieldIntoView({ target: originInput }); }, 160);
  }, { passive: true });
  originInput.addEventListener("touchstart", function () {
    setTimeout(function () { scrollFieldIntoView({ target: originInput }); }, 160);
  }, { passive: true });
}

if (destinationInput) {
  destinationInput.addEventListener("mousedown", function () {
    setTimeout(function () { scrollFieldIntoView({ target: destinationInput }); }, 160);
  }, { passive: true });
  destinationInput.addEventListener("touchstart", function () {
    setTimeout(function () { scrollFieldIntoView({ target: destinationInput }); }, 160);
  }, { passive: true });
}

        var fields = [
          'transparent-passengers-home', 'transparent-depart-date-home'
        ];
        fields.forEach(function(id) {
          var el = document.getElementById(id);
          if (el) {
            el.addEventListener('focus', onFieldFocus);
            el.addEventListener('click', onFieldFocus);
          }
        });
        document.querySelectorAll('.hero .etihad-field-dates label, .hero .etihad-field-guests label').forEach(function(lab) {
          lab.addEventListener('click', function() { setTimeout(onFieldFocus, 50); });
        });
        var form = document.getElementById('transparent-search-form-home');
        if (form) form.addEventListener('focusin', function(e) {
          if (e.target && e.target.closest && (e.target.closest('#originContainer') || e.target.closest('#destContainer'))) return;
          if (e.target.matches('input, select, [role="combobox"]')) onFieldFocus();
        });
      })();

      // Tab switching functionality
      if (transparentSearch) {
        const tabCols = transparentSearch.querySelectorAll('.transparent-tab-col');
        const tabContents = transparentSearch.querySelectorAll('.transparent-tab-content');
        
        tabCols.forEach(tabCol => {
          const tabLink = tabCol.querySelector('.transparent-tab-link');
          if (tabLink) {
            tabLink.addEventListener('click', function(e) {
              if (tabCol.getAttribute('data-disabled') === 'true') {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              const targetTab = this.getAttribute('href');
              
              // Remove active class from all tabs and contents
              tabCols.forEach(col => col.classList.remove('active'));
              tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
              });
              
              // Add active class to clicked tab
              tabCol.classList.add('active');
              
              // Show corresponding content
              const targetContent = transparentSearch.querySelector(targetTab);
              if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
              }
            });
          }
        });
      }
      
      // Popup functionality for From field (HOME PAGE)
      const fromInput = document.getElementById('transparent-txtOriginFull-home');
      let popupLoaded = false;
      let searchModal = null;
      let searchOverlay = null;
      let searchClose = null;
      
      function loadPopupSearch() {
        if (popupLoaded) return Promise.resolve();
        
        return fetch('/src/pages/popup-search.html')
          .then(response => response.text())
          .then(html => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html.trim();
            
            // Get overlay and modal from the loaded HTML
            const overlay = tempDiv.querySelector('.transparent-flight-search-overlay');
            const modal = tempDiv.querySelector('.transparent-flight-search');
            
            if (overlay) {
              document.body.appendChild(overlay);
            }
            if (modal) {
              document.body.appendChild(modal);
            }
            
            searchModal = document.getElementById('transparent-flight-search-modal');
            searchOverlay = document.getElementById('transparent-search-overlay');
            searchClose = document.getElementById('transparent-search-close');
            
            popupLoaded = true;
            
            // Initialize popup event listeners
            if (searchClose) {
              searchClose.addEventListener('click', closePopup);
            }
            if (searchOverlay) {
              searchOverlay.addEventListener('click', closePopup);
            }
            
            // Load popup JavaScript
            const script = document.createElement('script');
            script.src = '/src/pages/popup-search.js';
            script.onload = function() {
              setTimeout(function() {
                if (typeof initPopupFunctionality === 'function') {
                  initPopupFunctionality();
                }
              }, 100);
            };
            document.head.appendChild(script);
          })
          .catch(function() {});
      }
      
      function openPopup() {
        loadPopupSearch().then(() => {
          if (searchOverlay && searchModal) {
            searchOverlay.classList.add('active');
            searchModal.classList.add('popup-mode');
            searchModal.classList.add('active');
            document.body.style.overflow = 'hidden';
          }
        });
      }
      
      function closePopup() {
        if (searchOverlay && searchModal) {
          searchOverlay.classList.remove('active');
          searchModal.classList.remove('popup-mode');
          searchModal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
      
      if (fromInput) {
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && searchModal && searchModal.classList.contains('popup-mode')) {
            closePopup();
          }
        });
      }
      
      // Airport autocomplete + auto-advance for From/To
      (function initTransparentAirportAutocomplete() {
        function run() {
          if (typeof window.setupAirportAutocomplete !== 'function') return;
          var fromInput = document.getElementById('transparent-txtOriginFull-home');
          var toInput = document.getElementById('transparent-txtDestinationFull-home');
          if (!fromInput || !toInput) return;
          window.setupAirportAutocomplete(fromInput, 'transparent-origin-home', 'from');
          window.setupAirportAutocomplete(toInput, 'transparent-destination-home', 'to');
function scrollForDropdown(elId) {
  var el = document.getElementById(elId);
  if (!el) return;

  setTimeout(function () {
    var rect = el.getBoundingClientRect();
    var topLimit = 92;
    var bottomLimit = window.innerHeight - 320;

    if (rect.top < topLimit) {
      window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - topLimit), behavior: "smooth" });
    } else if (rect.bottom > bottomLimit) {
      window.scrollTo({ top: window.scrollY + (rect.bottom - bottomLimit), behavior: "smooth" });
    }
  }, 120);
}
          fromInput.addEventListener('change', function() {
            if ((fromInput.value || '').trim() && toInput) setTimeout(function() { toInput.focus(); }, 80);
          });
          toInput.addEventListener('change', function() {
            if ((toInput.value || '').trim()) {
              var travelDate = document.getElementById('transparent-depart-date-home');
              if (travelDate) setTimeout(function() { travelDate.focus(); }, 120);
            }
          });
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
        else run();
        window.addEventListener('load', run);
        // Clear buttons for From and To
        (function initFieldClearBtns() {
          var fromInp = document.getElementById('transparent-txtOriginFull-home');
          var toInp = document.getElementById('transparent-txtDestinationFull-home');
          var clearFrom = document.getElementById('clear-from-home');
          var clearTo = document.getElementById('clear-to-home');
          var origHidden = document.getElementById('transparent-origin-home');
          var destHidden = document.getElementById('transparent-destination-home');
          function toggleClear(btn, hasVal) { if (btn) btn.style.display = hasVal ? '' : 'none'; }
          function updateFromClear() { toggleClear(clearFrom, (fromInp && fromInp.value || '').trim()); }
          function updateToClear() { toggleClear(clearTo, (toInp && toInp.value || '').trim()); }
          if (fromInp) {
            fromInp.addEventListener('input', updateFromClear);
            fromInp.addEventListener('change', updateFromClear);
          }
          if (toInp) {
            toInp.addEventListener('input', updateToClear);
            toInp.addEventListener('change', updateToClear);
          }
          if (clearFrom) {
            clearFrom.addEventListener('click', function(e) {
              e.preventDefault();
              if (fromInp) { fromInp.value = ''; fromInp.focus(); updateFromClear(); }
              if (origHidden) origHidden.value = '';
            });
          }
          if (clearTo) {
            clearTo.addEventListener('click', function(e) {
              e.preventDefault();
              if (toInp) { toInp.value = ''; toInp.focus(); updateToClear(); }
              if (destHidden) destHidden.value = '';
            });
          }
          updateFromClear();
          updateToClear();
        })();
      })();
      // Field order validation: click To without From → show From; click Date without From/To → show From or To
      (function initFieldOrderValidation() {
        var fromInput = document.getElementById('transparent-txtOriginFull-home');
        var toInput = document.getElementById('transparent-txtDestinationFull-home');
        var departDateInput = document.getElementById('transparent-depart-date-home');
        if (!fromInput || !toInput || !departDateInput) return;
        function getOriginCode() {
          var v = (fromInput && fromInput.value) || (document.getElementById('from') && document.getElementById('from').value) || '';
          if (!v) return '';
          var m = v.match(/\(([A-Z]{3})\)/) || v.match(/,\s*([A-Z]{3})\s*$/);
          return m ? m[1] : (v.length === 3 ? v : '');
        }
        function getDestCode() {
          var v = (toInput && toInput.value) || (document.getElementById('to') && document.getElementById('to').value) || '';
          if (!v) return '';
          var m = v.match(/\(([A-Z]{3})\)/) || v.match(/,\s*([A-Z]{3})\s*$/);
          return m ? m[1] : (v.length === 3 ? v : '');
        }
        if (toInput) {
          toInput.addEventListener('mousedown', function(e) {
            if (!getOriginCode()) {
              e.preventDefault();
              e.stopPropagation();
              if (typeof showValidationError === 'function') {
                showValidationError('Please select a departure airport first.', ['transparent-txtOriginFull-home']);
              }
              fromInput.focus();
            }
          }, true);
          toInput.addEventListener('focus', function() {
            if (!getOriginCode()) {
              toInput.blur();
              if (typeof showValidationError === 'function') {
                showValidationError('Please select a departure airport first.', ['transparent-txtOriginFull-home']);
              }
              fromInput.focus();
            }
          }, true);
        }
        function requireFromAndToBeforeDate() {
          if (!getOriginCode()) {
            if (typeof showValidationError === 'function') {
              showValidationError('Please select a departure airport first.', ['transparent-txtOriginFull-home']);
            }
            fromInput.focus();
            return false;
          }
          if (!getDestCode()) {
            if (typeof showValidationError === 'function') {
              showValidationError('Please select an arrival airport first.', ['transparent-txtDestinationFull-home']);
            }
            toInput.focus();
            return false;
          }
          return true;
        }
        departDateInput.addEventListener('mousedown', function(e) {
          if (!requireFromAndToBeforeDate()) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
        departDateInput.addEventListener('focus', function() {
          if (!requireFromAndToBeforeDate()) departDateInput.blur();
        }, true);
      })();
      // Transparent form submit: sync to main form and trigger flight search (international flow)
      (function initTransparentFormSubmit() {
        var transparentForm = document.getElementById('transparent-search-form-home');
        var mainForm = document.getElementById('flight-search-form');
        if (!transparentForm || !mainForm) return;
        transparentForm.addEventListener('submit', function(e) {
          e.preventDefault();
          var fromDisplay = (document.getElementById('transparent-txtOriginFull-home') || {}).value || '';
          var toDisplay = (document.getElementById('transparent-txtDestinationFull-home') || {}).value || '';
          var origHidden = document.getElementById('transparent-origin-home');
          var destHidden = document.getElementById('transparent-destination-home');
          var fromVal = fromDisplay.trim() || (origHidden && origHidden.value ? origHidden.value : '');
          var toVal = toDisplay.trim() || (destHidden && destHidden.value ? destHidden.value : '');
          var fromMain = document.getElementById('from');
          var toMain = document.getElementById('to');
          if (fromMain) fromMain.value = fromVal;
          if (toMain) toMain.value = toVal;
          var fromHero = document.getElementById('from-hero');
          var toHero = document.getElementById('to-hero');
          if (fromHero) fromHero.value = fromVal;
          if (toHero) toHero.value = toVal;
          var tripHome = document.querySelector('input[name="trip-home"]:checked');
          var tripVal = tripHome && tripHome.value !== 'multicity' ? tripHome.value : 'oneway';
          var tripMain = document.querySelector('input[name="trip"][value="' + tripVal + '"]');
          if (tripMain) { tripMain.checked = true; tripMain.dispatchEvent(new Event('change', { bubbles: true })); }
          var cabinField = document.getElementById('transparent-class-home-2');
          var classSelect = document.getElementById('class');
          if (cabinField && classSelect) {
            var cabinToClass = { Economy: 'Economy Class', 'Premium Economy': 'Premium Economy', Business: 'Business Class', First: 'First Class' };
            classSelect.value = cabinToClass[cabinField.value] || 'Economy Class';
          }
          mainForm.requestSubmit();
        });
      })();
      // Swap From/To (Etihad-style)
      (function initEtihadSwap() {
        var swapBtn = document.getElementById('etihad-swap-origin-dest');
        var fromInput = document.getElementById('transparent-txtOriginFull-home');
        var toInput = document.getElementById('transparent-txtDestinationFull-home');
        var fromMain = document.getElementById('from');
        var toMain = document.getElementById('to');
        if (!swapBtn || !fromInput || !toInput) return;
        swapBtn.addEventListener('click', function(e) {
          e.preventDefault();
          var tmp = fromInput.value;
          fromInput.value = toInput.value;
          toInput.value = tmp;
          if (fromMain) fromMain.value = fromInput.value;
          if (toMain) toMain.value = toInput.value;
          var origHidden = document.getElementById('transparent-origin-home');
          var destHidden = document.getElementById('transparent-destination-home');
          if (origHidden && destHidden) {
            tmp = origHidden.value;
            origHidden.value = destHidden.value;
            destHidden.value = tmp;
          }
        });
      })();
      // Airport dropdown functionality
    });