# HS Technical Exam (Frontend)

Please refer to the Notion page provided via email for guidelines and tasks. Best of luck!

## Getting Started

### Prerequisites

- Node v20.18.0 or higher
- npm v10.8.2 or yarn v1.22.22

### Installation

1. Clone the repository: `git clone <repo-url>`
2. Create an `.env` file on the root folder and populate with these environment variables:
   ```json
   NEXT_PUBLIC_MAINNET_RPC="your_rpc_url_here"
   ```
3. Install dependencies: `npm run install` or `yarn`
4. Start development server: `npm run dev` or `yarn run dev`


# GREETINGS!

Hey HawkFi evaluating team! My name is Magnus. I know this application isn't exactly perfect -> some flaws in UI and missing warnings when trying to input wrong values, but I tried to ensure that these values would not go through at all in the first place. 

## Things I've done:
- New Pool Function
- New Position Function
- Collecting symbols and images via external API for display
- Displaying transaction history

## Things that I found tricky:
- Connecting my wallet and displaying the balance always gave me an error "Account not ta token wallet" via the RPC and SOL devkit -> kind of weird
- Finding a way to display the transaction history since there was no clear design allotted
- Mental gap between the initial understanding that the base token address was the same as the mint of the token

## Things I used AI for:
- Bridging knowledge gaps for Web3 and understanding tokens
- Getting ahead and letting it explain the documentation to me as a crash course on what to do
- Understanding how to compute for bin steps and drafting a formula (I could be wrong with the computation)
- Understanding how MUI works and what the different components do
- Developed baseline box formation for the pool segment of the form -> used as a guide to create other parts of the code
- Extra validation steps for the UI to turn red if input is wrong
- General styling and positioning of UI components

# Thanks!

Thanks again for taking the time and allowing me the opportunity to apply for your company. Looking forward to getting a response, whether positive or negative from you. Cheers!
