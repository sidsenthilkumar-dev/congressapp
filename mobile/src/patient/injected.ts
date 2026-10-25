// Applied only inside the native client's WebView, never to website visitors.
export const nativePresentationScript = `
(function(){
 window.ReboundNativeCapabilities={cameraPermission:true};
 const style=document.createElement('style');style.id='rebound-native-presentation';
 style.textContent='.sidebar,header,.page-heading,footer{display:none!important}.shell{margin:0!important}.shell main{padding:18px!important}.modal-backdrop{padding:0!important}.modal{width:100%!important;max-width:none!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;padding:24px 20px!important}.modal>.close{display:none!important}.app{min-height:0!important}';
 document.head.appendChild(style);
 window.setTimeout(()=>window.dispatchEvent(new CustomEvent('rebound:native-action',{detail:{type:'sync'}})),300);
})();true;`;
export function nativeActionScript(action: Record<string, unknown>) {
  return `window.dispatchEvent(new CustomEvent('rebound:native-action',{detail:${JSON.stringify(action)}}));true;`;
}
