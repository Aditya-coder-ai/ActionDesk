import { NextResponse } from 'next/server'
import { exec } from 'node:child_process'
import path from 'node:path'

export async function POST(request: Request) {
  try {
    const { source } = await request.json().catch(() => ({ source: 'synthetic' }))
    const projectRoot = path.resolve(process.cwd(), '..')
    const cmd = source === 'gmail' ? 'python -m app.pipeline --source gmail' : 'python -m app.pipeline'

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message, stderr }, { status: 500 }))
        } else {
          resolve(NextResponse.json({ success: true, stdout }))
        }
      })
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
