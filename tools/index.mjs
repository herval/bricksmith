export {Library,installLibrary,indexLibrary,auditLibrary,DEFAULT_LIBRARY,CatalogError} from './catalog/library.mjs';
export {parseScene,validateScene,sceneLDraw,inventoryScene,exportScene} from './catalog/scene.mjs';
// Keep catalog and export consumers independent of the headless renderer startup.
export async function renderScene(...args) {
  const {renderScene: render} = await import('./catalog/render.mjs');
  return render(...args);
}
