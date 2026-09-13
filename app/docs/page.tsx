import Link from 'next/link'
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  Code2Icon,
  FolderIcon,
  MailIcon,
  SendIcon,
  Settings2Icon,
  UsersRoundIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const sections = [
  ['folders', 'Folders & SMTP'],
  ['projects', 'Projects'],
  ['recipients', 'Sender & recipients'],
  ['dynamic-data', 'Dynamic data'],
  ['settings', 'Project settings'],
  ['sending', 'Send mail']
]
function Section ({
  id,
  icon: Icon,
  eyebrow,
  title,
  children
}: {
  id: string
  icon: typeof FolderIcon
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className='scroll-mt-24 border-border border-t py-12 first:border-t-0 first:pt-0 sm:py-16'
    >
      <div className='flex gap-4'>
        <div className='border-border bg-muted/45 mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg border'>
          <Icon className='text-muted-foreground size-4' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>
            {eyebrow}
          </p>
          <h2 className='mt-2 text-2xl font-semibold tracking-tight'>
            {title}
          </h2>
          <div className='text-muted-foreground mt-5 space-y-4 text-sm leading-7'>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
export default function DocsPage () {
  return (
    <div className='bg-background min-h-screen'>
      <header className='border-border/80 bg-background/85 sticky top-0 z-20 border-b backdrop-blur'>
        <nav className='mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8'>
          <Link href='/' className='text-lg font-semibold tracking-tight'>
            Mailr
          </Link>
          <div className='flex items-center gap-3'>
            <Button
              asChild
              variant='ghost'
              size='sm'
              className='text-foreground'
            >
              <Link href='/docs'>Docs</Link>
            </Button>
            <Button asChild size='sm'>
              <Link href='/projects'>
                Open workspace <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </nav>
      </header>
      <main className='mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16'>
        <div className='border-border bg-card/45 rounded-xl border px-6 py-10 sm:px-10 sm:py-14'>
          <div className='border-border bg-muted/45 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium'>
            <BookOpenIcon className='size-3.5' />
            Documentation
          </div>
          <h1 className='mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl'>
            Everything you need to send a great email.
          </h1>
          <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-7'>
            Mailr separates shared delivery setup from each email project, so
            you can build, personalize, and send with a clear workflow.
          </p>
        </div>
        <div className='mt-12 grid gap-12 lg:grid-cols-[13rem_minmax(0,1fr)]'>
          <aside className='lg:sticky lg:top-24 lg:h-fit'>
            <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase'>
              On this page
            </p>
            <nav className='border-border space-y-1 border-l'>
              {sections.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className='text-muted-foreground hover:text-foreground hover:border-foreground block border-l border-transparent px-3 py-1.5 text-sm transition-colors'
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>
          <div className='max-w-2xl'>
            <Section
              id='folders'
              icon={FolderIcon}
              eyebrow='Start here'
              title='Folders keep delivery setup together.'
            >
              <p>
                A folder is a home for related projects, such as transactional
                emails, product updates, or a client campaign. Every project
                belongs to one folder.
              </p>
              <p>
                SMTP settings are shared by all projects in that folder. On the{' '}
                <strong className='text-foreground font-medium'>
                  Projects
                </strong>{' '}
                page, create or select a folder, then choose{' '}
                <strong className='text-foreground font-medium'>
                  Folder settings
                </strong>{' '}
                to enter its SMTP details.
              </p>
              <div className='border-border bg-muted/25 rounded-lg border p-4'>
                <p className='text-foreground font-medium'>SMTP setup</p>
                <ul className='mt-2 list-inside list-disc space-y-1'>
                  <li>
                    <strong className='text-foreground font-medium'>
                      Host
                    </strong>{' '}
                    is your provider&apos;s SMTP server, for example{' '}
                    <code>smtp.example.com</code>.
                  </li>
                  <li>
                    <strong className='text-foreground font-medium'>
                      Port
                    </strong>{' '}
                    is usually 465 for implicit TLS or 587 for STARTTLS.
                  </li>
                  <li>
                    Turn on{' '}
                    <strong className='text-foreground font-medium'>
                      Implicit TLS
                    </strong>{' '}
                    for port 465; leave it off for STARTTLS on 587.
                  </li>
                  <li>
                    Your{' '}
                    <strong className='text-foreground font-medium'>
                      Username
                    </strong>{' '}
                    is also used as the sender email address.
                  </li>
                  <li>
                    Save the settings before sending. They are stored in your
                    current browser.
                  </li>
                </ul>
              </div>
            </Section>
            <Section
              id='projects'
              icon={Code2Icon}
              eyebrow='Your email'
              title='Projects are individual email messages.'
            >
              <p>
                Create a project inside the folder you want to use. A project
                contains the HTML body, its subject and recipient details, any
                dynamic-data list, and project-level settings.
              </p>
              <p>
                Open a project to use the{' '}
                <strong className='text-foreground font-medium'>Editor</strong>.
                Write or paste your email HTML on the left and check the
                rendered result in the live preview. You can return to Projects
                anytime to rename, duplicate, export, import, or move a project.
              </p>
            </Section>
            <Section
              id='recipients'
              icon={UsersRoundIcon}
              eyebrow='Addressing'
              title='Set the sender, subject, and recipients.'
            >
              <p>
                In{' '}
                <strong className='text-foreground font-medium'>
                  Sender &amp; recipients
                </strong>
                , add a From name, optional Reply-To address, and subject line.
                The From email comes from the SMTP username configured on the
                project&apos;s folder.
              </p>
              <p>
                Use the To, Cc, and Bcc fields for a regular email. Multiple
                addresses can be separated with commas. The normal Send mail
                flow uses this fixed To list.
              </p>
            </Section>
            <Section
              id='dynamic-data'
              icon={UsersRoundIcon}
              eyebrow='Personalization'
              title='Use dynamic data for one personalized email per row.'
            >
              <p>
                Dynamic data is a JSON array where each object represents one
                recipient. Paste it into{' '}
                <strong className='text-foreground font-medium'>
                  Dynamic data
                </strong>
                , import a JSON file, then select the column that contains
                recipient email addresses.
              </p>
              <pre className='border-border bg-muted/35 overflow-x-auto rounded-lg border p-4 text-xs leading-6'>
                <code>{`[\n  { "email": "alex@example.com", "name": "Alex", "plan": "Pro" },\n  { "email": "sam@example.com", "name": "Sam", "plan": "Starter" }\n]`}</code>
              </pre>
              <p>
                Reference each value in your HTML or subject with a placeholder
                such as <code>{'{{name}}'}</code> or <code>{'{{plan}}'}</code>.
                Mailr checks the placeholders against your JSON keys, previews
                the rows, then sends a separate personalized message to every
                valid address when you choose{' '}
                <strong className='text-foreground font-medium'>
                  Send personalized
                </strong>
                .
              </p>
            </Section>
            <Section
              id='settings'
              icon={Settings2Icon}
              eyebrow='Project controls'
              title='Use Settings to manage the project itself.'
            >
              <p>
                The{' '}
                <strong className='text-foreground font-medium'>
                  Settings
                </strong>{' '}
                section is for project-level actions rather than the content of
                the email. Rename a project so it is easy to find, duplicate it
                as a starting point for another message, export a JSON backup,
                or delete a project you no longer need.
              </p>
            </Section>
            <Section
              id='sending'
              icon={SendIcon}
              eyebrow='Delivery'
              title='The Send mail button delivers your regular email.'
            >
              <p>
                The{' '}
                <strong className='text-foreground font-medium'>
                  Send mail
                </strong>{' '}
                button in a project&apos;s top navigation opens a final delivery
                check. It sends the current HTML using the folder&apos;s SMTP
                configuration and the fixed recipients from Sender &amp;
                recipients.
              </p>
              <div className='border-border bg-muted/25 rounded-lg border p-4'>
                <div className='text-foreground flex items-center gap-2 font-medium'>
                  <CheckCircle2Icon className='size-4' />
                  Before you send
                </div>
                <ul className='mt-2 list-inside list-disc space-y-1'>
                  <li>Save SMTP in the project&apos;s folder.</li>
                  <li>
                    Make sure its username is the email address you send from.
                  </li>
                  <li>
                    Save the sender details and add at least one To recipient.
                  </li>
                  <li>
                    For a campaign from dynamic data, use{' '}
                    <strong className='text-foreground font-medium'>
                      Send personalized
                    </strong>{' '}
                    instead-the normal button intentionally uses the fixed To
                    field.
                  </li>
                </ul>
              </div>
            </Section>
            <div className='border-border bg-card rounded-xl border p-6'>
              <MailIcon className='text-muted-foreground size-5' />
              <h2 className='mt-4 text-xl font-semibold'>
                Ready to make an email?
              </h2>
              <p className='text-muted-foreground mt-2 text-sm leading-6'>
                Create a folder, set its SMTP details, then start your first
                project.
              </p>
              <Button asChild className='mt-5'>
                <Link href='/projects'>
                  Open projects <ArrowRightIcon />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}