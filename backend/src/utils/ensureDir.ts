import fs from 'node:fs'

export function ensureDir(path: string){
  if(!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}