import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.css')) {
    return {
      format: 'module',
      shortCircuit: true,
      url: `data:text/javascript,export default {}`
    };
  }
  return nextResolve(specifier, context);
}
export async function load(url, context, nextLoad) {
  if (url.startsWith('data:text/javascript')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default {}'
    };
  }
  return nextLoad(url, context);
}
