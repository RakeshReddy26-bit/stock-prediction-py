import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaLeaf, 
  FaClock, 
  FaUsers, 
  FaAward,
  FaPhone,
  FaArrowRight
} from 'react-icons/fa';

const About = () => {
  const stats = [
    {
      icon: <FaUsers className="text-4xl text-blue-600" />,
      number: "10,000+",
      label: "Happy Customers"
    },
    {
      icon: <FaClock className="text-4xl text-green-600" />,
      number: "5+",
      label: "Years Experience"
    },
    {
      icon: <FaLeaf className="text-4xl text-purple-600" />,
      number: "100%",
      label: "Eco-Friendly"
    },
    {
      icon: <FaAward className="text-4xl text-yellow-600" />,
      number: "99.9%",
      label: "Satisfaction Rate"
    }
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "👩‍💼",
      description: "10+ years in textile care industry"
    },
    {
      name: "Mike Chen",
      role: "Head of Operations",
      image: "👨‍💻",
      description: "Expert in logistics and quality control"
    },
    {
      name: "Emily Davis",
      role: "Customer Success Manager",
      image: "👩‍🎨",
      description: "Dedicated to exceptional customer experience"
    }
  ];

  const values = [
    {
      icon: <FaLeaf className="text-3xl text-green-600" />,
      title: "Sustainability",
      description: "We use only eco-friendly, biodegradable cleaning products to protect our planet."
    },
    {
      icon: <FaAward className="text-3xl text-blue-600" />,
      title: "Quality",
      description: "We maintain the highest standards of care for every garment that comes through our doors."
    },
    {
      icon: <FaClock className="text-3xl text-purple-600" />,
      title: "Reliability",
      description: "On-time pickup and delivery, every time. Your schedule is our priority."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              About ReWash
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Your trusted partner in professional laundry care since 2019
            </motion.p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Founded in 2019, ReWash started with a simple mission: to make professional laundry care 
                accessible, convenient, and environmentally responsible. What began as a small local service 
                has grown into a trusted brand serving thousands of customers.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that taking care of your clothes shouldn't be a hassle. That's why we've built 
                our service around convenience, quality, and sustainability. From our eco-friendly cleaning 
                products to our reliable pickup and delivery service, everything we do is designed with 
                you and the environment in mind.
              </p>
              <p className="text-lg text-gray-600">
                Today, we're proud to be the go-to laundry service for busy professionals, families, and 
                anyone who values quality care for their garments.
              </p>
            </motion.div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-12 text-center">
                <div className="text-8xl mb-6">🧺</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Care</h3>
                <p className="text-gray-600">
                  Every garment receives individual attention and care from our expert team
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Numbers that showcase our commitment to excellence and customer satisfaction
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The core principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate people behind ReWash's exceptional service
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-8xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {member.image}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <div className="text-blue-600 font-medium mb-4">{member.role}</div>
                <p className="text-gray-600">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Experience the ReWash Difference
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join our community of satisfied customers and see why we're the trusted choice for laundry care
            </p>
            <Link 
              to="/contact"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
            >
              <FaPhone />
              <span>Get Started Today</span>
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
