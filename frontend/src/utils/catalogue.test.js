import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(readFileSync(path.resolve(__dirname,'../../../supabase/sample-data/products.json'),'utf8'));
const local=JSON.parse(readFileSync(path.resolve(__dirname,'../data/sample-catalogue.json'),'utf8'));
describe('sample catalogue',()=>{
 it('contains exactly 50 clearly local sample products across 6 categories',()=>{expect(source.products).toHaveLength(50);expect(source.categories).toHaveLength(6);expect(local.products).toHaveLength(50);expect(new Set(source.products.map(p=>p.slug)).size).toBe(50)});
 it('has valid catalogue fields and stock examples',()=>{for(const p of source.products){expect(p.name).toBeTruthy();expect(p.description.length).toBeGreaterThan(20);expect(p.price).toBeGreaterThan(0);expect(p.stock).toBeGreaterThanOrEqual(0);expect(p.weight).toBeTruthy()}expect(source.products.some(p=>p.stock===0)).toBe(true)});
 it('physically bundles every image in both public and Supabase source folders',()=>{const publicDir=path.resolve(__dirname,'../../public/products');expect(readdirSync(publicDir).filter(x=>/\.jpe?g$/i.test(x))).toHaveLength(50);for(const p of source.products){expect(existsSync(path.resolve(publicDir,p.image_file)),`public image missing for ${p.slug}`).toBe(true);expect(existsSync(path.resolve(__dirname,'../../../supabase/sample-data/images',p.image_file)),`Supabase image missing for ${p.slug}`).toBe(true);const localProduct=local.products.find(x=>x.slug===p.slug);expect(localProduct.image_url).toBe(`/products/${p.image_file}`)}});
});
