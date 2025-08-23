import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  userName: string
  userEmail: string
}

export const WelcomeEmail = ({
  userName,
  userEmail,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to our community platform!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome {userName}! 🎉</Heading>
        
        <Text style={text}>
          Thank you for joining our community platform! We're excited to have you as part of our growing community.
        </Text>
        
        <Text style={text}>
          Here's what you can do now:
        </Text>
        
        <ul style={list}>
          <li style={listItem}>Browse and join communities that interest you</li>
          <li style={listItem}>Participate in discussions and share your thoughts</li>
          <li style={listItem}>Attend events and connect with like-minded people</li>
          <li style={listItem}>Create your own discussions and events</li>
        </ul>
        
        <Text style={text}>
          Your account is now active and ready to use. Start exploring and connecting with others!
        </Text>
        
        <Text style={footer}>
          If you have any questions, feel free to reach out to our support team.
          <br />
          <br />
          Welcome aboard!
          <br />
          The Community Platform Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}

const list = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  paddingLeft: '20px',
}

const listItem = {
  margin: '8px 0',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  marginBottom: '24px',
}