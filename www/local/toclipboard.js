/**
 * From: https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
 * Usage:
 *
 * var copyBobBtn = document.querySelector('.js-copy-bob-btn'),
 *    copyJaneBtn = document.querySelector('.js-copy-jane-btn');
 * copyBobBtn.addEventListener('click', function(event) {
 *   copyTextToClipboard('Bob');
 * });
 *
 * copyJaneBtn.addEventListener('click', function(event) {
 *   copyTextToClipboard('Jane');
 * });
 *
 * <div style="display:inline-block; vertical-align:top;">
 *   <button class="js-copy-bob-btn">Set clipboard to BOB</button><br /><br />
 *   <button class="js-copy-jane-btn">Set clipboard to JANE</button>
 * </div>
 * <div style="display:inline-block;">
 *   <textarea class="js-test-textarea" cols="35" rows="4">Try pasting into here to see what you have on your clipboard:
 *   </textarea>
 * </div>
 */

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function() {
        console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
        console.error('Async: Could not copy text: ', err);
    });
}