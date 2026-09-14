// Starts and seeds the throwaway Postgres the Database panel's end-to-end
// specs run against. Safe to re-run any time -- the container is created only
// if it is missing, and the seed is rewritten from scratch each time.
//
// The two specs in client/tests/collab.spec.ts that cover the Database panel
// query a "widgets" table with exactly two rows. That table used to exist only
// on whichever machine had been set up by hand, so a fresh checkout failed
// both specs with `relation "widgets" does not exist` and no hint about why.
//
// Run it with:  npm run setup-test-db     (from server/)
//
// Deliberately separate from the test run rather than wired into Playwright's
// globalSetup: it needs Docker, and most of the suite does not. Making every
// run depend on a container would turn "Docker isn't running" into a total
// failure instead of two skipped features.
const { execFileSync } = require('child_process')

const CONTAINER = 'codemesh_pg'
const IMAGE = 'postgres:16-alpine'
const PASSWORD = 'test'
const PORT = '5432'

// Matches TEST_DB_CONNECTION in client/tests/collab.spec.ts. Bound to
// loopback: this database exists only for the local suite and has a password
// of "test", so it must not be reachable from anywhere else.
const SEED_SQL = `
  CREATE TABLE IF NOT EXISTS widgets (id serial PRIMARY KEY, name text NOT NULL);
  TRUNCATE widgets RESTART IDENTITY;
  INSERT INTO widgets (name) VALUES ('sprocket'), ('gadget');
`

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', ...options })
}

/** Synchronous sleep -- this script is a linear setup task, not a server. */
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function quiet(command, args) {
  try {
    execFileSync(command, args, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function main() {
  if (!quiet('docker', ['info'])) {
    console.error('Docker is not running. Start Docker Desktop (or dockerd) and re-run.')
    process.exit(1)
  }

  const existing = run('docker', ['ps', '-aq', '-f', `name=^${CONTAINER}$`]).trim()
  if (existing) {
    // `docker start` on an already-running container is a no-op, so there is
    // no need to check which state it is in first.
    quiet('docker', ['start', CONTAINER])
    console.log(`${CONTAINER} already exists -- started`)
  } else {
    console.log(`Creating ${CONTAINER} from ${IMAGE}`)
    run('docker', [
      'run', '-d',
      '--name', CONTAINER,
      '-e', `POSTGRES_PASSWORD=${PASSWORD}`,
      '-p', `127.0.0.1:${PORT}:${PORT}`,
      IMAGE,
    ], { stdio: 'inherit' })
  }

  // Postgres accepts connections a second or two after the container starts,
  // so seeding immediately fails on a cold create.
  process.stdout.write('Waiting for Postgres')
  let ready = false
  for (let i = 0; i < 30; i++) {
    if (quiet('docker', ['exec', CONTAINER, 'pg_isready', '-q'])) {
      ready = true
      break
    }
    process.stdout.write('.')
    sleep(1000)
  }
  console.log('')
  if (!ready) {
    console.error(`${CONTAINER} did not become ready. Check: docker logs ${CONTAINER}`)
    process.exit(1)
  }

  run('docker', ['exec', '-e', `PGPASSWORD=${PASSWORD}`, CONTAINER,
    'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', SEED_SQL], { stdio: 'inherit' })

  const rows = run('docker', ['exec', '-e', `PGPASSWORD=${PASSWORD}`, CONTAINER,
    'psql', '-U', 'postgres', '-tAc', 'SELECT name FROM widgets ORDER BY id']).trim()
  console.log(`\nwidgets seeded: ${rows.split('\n').join(', ')}`)
  console.log(`Connection string used by the specs: postgres://postgres:${PASSWORD}@127.0.0.1:${PORT}/postgres`)
}

main()
