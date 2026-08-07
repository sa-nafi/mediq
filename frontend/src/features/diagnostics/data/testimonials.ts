export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  avatarInitials: string;
}

/** Demo testimonials — not based on real patient feedback */
export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Fatima R.',
    location: 'Dhaka',
    rating: 5,
    quote: 'The entire experience was seamless — from booking my appointment online to receiving my test results. The staff was professional and the facility is very clean and modern.',
    avatarInitials: 'FR',
  },
  {
    id: '2',
    name: 'Arif K.',
    location: 'Chittagong',
    rating: 5,
    quote: 'I was impressed by how quickly I got my reports. The digital portal made it easy to access everything without a second visit. Highly recommended for anyone who values their time.',
    avatarInitials: 'AK',
  },
  {
    id: '3',
    name: 'Nusrat J.',
    location: 'Sylhet',
    rating: 4,
    quote: 'Very professional and well-organized diagnostic center. The health checkup package was comprehensive, and the doctors took time to explain each result clearly.',
    avatarInitials: 'NJ',
  },
  {
    id: '4',
    name: 'Mahmudul H.',
    location: 'Rajshahi',
    rating: 5,
    quote: 'As someone who is nervous about medical tests, I felt very comfortable here. The staff was patient and reassuring throughout the entire process.',
    avatarInitials: 'MH',
  },
];
