import Link from 'next/link'
import { ArrowRightIcon, Code2Icon, MailIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className='bg-background min-h-screen overflow-hidden'>
      <header className='border-border/80 bg-background/85 sticky top-0 z-20 border-b backdrop-blur'>
        <nav className='mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8'>
          <Link
            href='/'
            className='text-foreground text-lg font-semibold tracking-tight'
          >
            Mailr
          </Link>
          <div className='flex items-center gap-2 sm:gap-3'>
            <Button
              asChild
              variant='ghost'
              size='sm'
              className='text-muted-foreground hover:text-foreground'
            >
              <Link href='/docs'>Docs</Link>
            </Button>
            <Button asChild size='sm' className='hidden sm:inline-flex'>
              <Link href='/projects'>
                Open workspace <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </nav>
      </header>
      <main>
        <section className='relative mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28'>
          <div className='bg-foreground/5 absolute top-[-12rem] left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl' />
          <div className='mx-auto max-w-4xl text-center'>
            <h1 className='text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-8xl'>
              The calmer way to send email.
            </h1>
            <p className='text-muted-foreground mx-auto mt-7 max-w-xl text-base leading-7 sm:text-lg'>
              Write the HTML. Make it personal. Send with confidence.
            </p>
            <div className='mt-9 flex flex-col justify-center gap-3 sm:flex-row'>
              <Button asChild size='lg' className='gap-2'>
                <Link href='/projects'>
                  Start creating <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size='lg' variant='outline'>
                <Link href='/docs'>Explore the docs</Link>
              </Button>
            </div>
          </div>
          <div className='border-border bg-card/65 relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-xl border shadow-2xl shadow-black/20'>
            <div className='border-border flex h-11 items-center gap-2 border-b px-4'>
              <div className='bg-muted-foreground/35 size-2.5 rounded-full' />
              <div className='bg-muted-foreground/35 size-2.5 rounded-full' />
              <div className='bg-muted-foreground/35 size-2.5 rounded-full' />
              <div className='bg-muted/80 text-muted-foreground ml-3 rounded-md px-3 py-1 font-mono text-[10px]'>
                mailr / welcome-email
              </div>
            </div>
            <div className='grid min-h-[19rem] md:grid-cols-[11rem_1fr]'>
              <aside className='border-border bg-sidebar/55 hidden border-r p-3 md:block'>
                <p className='text-muted-foreground px-2 py-2 text-[10px] font-semibold tracking-widest uppercase'>
                  Workspace
                </p>
                {[
                  'Editor',
                  'Sender & recipients',
                  'Dynamic data',
                  'Settings'
                ].map((item, index) => (
                  <div
                    key={item}
                    className={`mb-1 rounded-md px-2.5 py-2 text-xs ${index === 0
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground'
                      }`}
                  >
                    {item}
                  </div>
                ))}
              </aside>
              <div className='grid min-h-[19rem] grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0'>
                <div className='p-5 sm:p-7'>
                  <div className='text-muted-foreground flex items-center gap-2 font-mono text-xs'>
                    <Code2Icon className='size-3.5' />
                    message.html
                  </div>
                  <pre className='mt-5 overflow-hidden font-mono text-[11px] leading-6 text-muted-foreground sm:text-xs'>
                    <code>
                      <span className='text-violet-300'>&lt;h1&gt;</span>
                      {'Welcome, {{name}}!'}
                      <span className='text-violet-300'>&lt;/h1&gt;</span>
                      {'\n'}
                      <span className='text-violet-300'>&lt;p&gt;</span>
                      {'Your workspace is ready.'}
                      <span className='text-violet-300'>&lt;/p&gt;</span>
                      {'\n\n'}
                      <span className='text-muted-foreground/60'>
                        {'<!-- Personalize with data -->'}
                      </span>
                    </code>
                  </pre>
                </div>
                <div className='bg-background/45 p-5 sm:p-7'>
                  <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                    <MailIcon className='size-3.5' />
                    Live preview
                  </div>
                  <div className='bg-card border-border mt-5 rounded-lg border p-5 shadow-sm'>
                    <div className='bg-foreground mb-5 h-5 w-16 rounded' />
                    <p className='text-lg font-semibold tracking-tight'>
                      Welcome, Alex!
                    </p>
                    <p className='text-muted-foreground mt-2 text-xs leading-5'>
                      Your workspace is ready. Let&apos;s make something great.
                    </p>
                    <div className='bg-foreground text-background mt-5 inline-flex rounded-md px-3 py-1.5 text-[10px] font-medium'>
                      Get started
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
