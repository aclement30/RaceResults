# Race Results

A web application for scraping, compiling and displaying races results for road cycling races in British Columbia,
Canada. This project is made of 2 main components:

- A sets of lambdas functions that periodically scrape and compile race results from various sources, storing the data
  in a structured format as JSON files in an S3 bucket. The main components are:
    - `cbc-membership`: Query Cycling BC membership data on a weekly schedule using a pre-existing list of athletes
    - `watcher`: Periodically fetch and compile race results from various sources, including:
        - Wimsey Timing Services (CrossMgr)
        - Webscorer
        - Manual import of CSV files
    - `watcher/athletes`: Compile athlete data from the race results and Cycling BC membership data
- A client web application built with React and Vite that displays the results. This application is designed to be fast,
  cost-effective, and mobile-friendly, with a focus on user experience. As such, there is no backend server or database.
  The client app directly fetches the pre-compiled JSON files from the S3 bucket and displays the results in a
  user-friendly format. The client app is deployed to an S3 bucket and served via CloudFront CDN.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) (v10+ recommended)
- AWS credentials with S3 and CloudFront permissions (for deployment)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/aclement30/race-results.git
   cd race-results
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   Update the `.env.local` file in the root directory and replace with your AWS configuration (no secret keys):
   ```env
   VITE_AWS_REGION=us-west-2
   VITE_AWS_POOL_ID=[cognito-identity-pool-id]
   VITE_RR_S3_BUCKET=[bucket-name]
   ```

   Update the `.env.production` file in the root directory and replace with your prod configuration that will be used
   when building the production app:
   ```env
   VITE_RR_S3_BUCKET=[bucket-name]
   ```

---

## Development

### Client App

Start the local development server:

```sh
npm run dev
```

#### Building for production

Build the optimized production bundle:

```sh
npm run build
```

The output will be in the `dist/` directory.

#### Deployment

Deploy the built app to AWS S3 and invalidate the CloudFront cache:

```sh
npm run deploy
```

**Note:**

- Ensure your AWS credentials are configured locally and you have appropriate S3 & CloudFront permissions (via
  environment variables or AWS config files).
- The deployment script will:
    - Delete existing files from the S3 bucket
    - Upload new files from `dist/`
    - Invalidate the CloudFront distribution

---

### Lambdas

The lambda functions are located in the `lambdas/` directory. Each lambda has its own directory with a `package.json`
file. Shared code between lambdas is located in `lambdas/shared/` directory.

#### Installing dependencies

To install dependencies for a specific lambda, navigate to its directory and run:

```sh
cd lambdas/<lambda-name>
npm install
```

#### Running locally

To run a lambda function locally, you can use the `run-local.ts` script which will invoke the lambda function handler
with predefined options. This is useful for testing and debugging.

```sh
cd lambdas/<lambda-name>
npm run local
```

**Note:**

When running locally, the lambda functions will duplicate every JSON files sent to the S3 bucket to a local `storage/`
folder for easier debugging. This folder mirrors the S3 bucket, but most of its contents will be ignored by Git.

#### Building & deploying

To build and deploy a lambda function, you can use the `build` and `deploy` scripts:

```sh
cd lambdas/<lambda-name>
npm run build
npm run deploy
```

**Note:**

- Ensure your AWS credentials are configured locally and you have appropriate Lambda permissions (via
  environment variables or AWS config files).
- The deployment script will:
    - Upload the built lambda function to AWS Lambda (both stage & production versions)

---

## License

This project is private and not licensed for redistribution.