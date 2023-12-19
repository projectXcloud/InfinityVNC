import UI from "./ui.js";

// This function writes the client clipboard
// this is called in the ui.js inside clipboardReceive(e) 
export function textAreaToClientClipboard(text){
    // console.log("called")
    navigator.clipboard.writeText(text).then(function() {
        console.log('Writing to clipboard was successful!');
      }, function(err) {
        console.error('Could not write to clipboard: ', err);
      });
}

// This function writes host clipboard & noVNC textarea from client clipboard every second
setInterval(()=>{
    if(UI){
        UI.clipboardSend();
    }
}, 1000);
