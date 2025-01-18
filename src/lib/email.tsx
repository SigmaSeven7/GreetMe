import emailjs from '@emailjs/browser';

interface SendAccessCodeParams {
  email: string | null;
  access_code: string | null;
  greeting_id: string;
}

export const sendAccessCode = async ({ email, access_code, greeting_id }: SendAccessCodeParams) => {
  try {
    const templateParams = {
      to_email: email,
      access_code: access_code,
      greeting_link: greeting_id,
      message: `Your access code is: ${access_code}\nAccess your greeting at: ${greeting_id}`
    };

    const response = await emailjs.send(
      'service_g5snqdd',     // Get from EmailJS dashboard
      'template_xc99hj7',    // Get from EmailJS dashboard
      templateParams,
      'DfZiizWU5k0fgP8XL'      // Get from EmailJS dashboard
    );

    if (response.status === 200) {
      return { success: true };
    }
    throw new Error('Failed to send email');
    
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};


