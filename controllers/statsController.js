const Registration = require('../models/Registration');

// Get registration statistics
exports.getStats = async (req, res) => {
  try {
    // Total registrations
    const totalRegistrations = await Registration.countDocuments({ status: 'confirmed' });

    // Event-wise distribution
    const eventStats = await Registration.aggregate([
      { $match: { status: 'confirmed' } },
      { $unwind: '$interestedEvents' },
      { 
        $group: {
          _id: '$interestedEvents',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Branch-wise distribution
    const branchStats = await Registration.aggregate([
      { $match: { status: 'confirmed' } },
      { 
        $group: {
          _id: '$branch',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Year-wise distribution
    const yearStats = await Registration.aggregate([
      { $match: { status: 'confirmed' } },
      { 
        $group: {
          _id: '$year',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Daily registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyTrend = await Registration.aggregate([
      { 
        $match: { 
          status: 'confirmed',
          registrationDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$registrationDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Hourly distribution (to find peak registration times)
    const hourlyDistribution = await Registration.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: {
            $hour: '$registrationDate'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent registrations
    const recentRegistrations = await Registration.find({ status: 'confirmed' })
      .sort({ registrationDate: -1 })
      .limit(10)
      .select('name rollNumber branch interestedEvents registrationDate registrationNumber');

    // Calculate percentage interested in both events
    const bothEventsCount = await Registration.countDocuments({
      status: 'confirmed',
      interestedEvents: 'Both'
    });

    const bothEventsPercentage = totalRegistrations > 0 
      ? ((bothEventsCount / totalRegistrations) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRegistrations,
          bothEventsPercentage: `${bothEventsPercentage}%`,
          lastUpdated: new Date().toISOString()
        },
        distributions: {
          events: eventStats.map(stat => ({
            event: stat._id,
            count: stat.count,
            percentage: ((stat.count / totalRegistrations) * 100).toFixed(2) + '%'
          })),
          branches: branchStats.map(stat => ({
            branch: stat._id,
            count: stat.count,
            percentage: ((stat.count / totalRegistrations) * 100).toFixed(2) + '%'
          })),
          years: yearStats.map(stat => ({
            year: stat._id,
            count: stat.count,
            percentage: ((stat.count / totalRegistrations) * 100).toFixed(2) + '%'
          }))
        },
        trends: {
          daily: dailyTrend.map(day => ({
            date: day._id,
            count: day.count
          })),
          hourly: hourlyDistribution.map(hour => ({
            hour: `${hour._id}:00`,
            count: hour.count
          }))
        },
        recentRegistrations
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

// Get event-specific stats
exports.getEventStats = async (req, res) => {
  try {
    const { eventName } = req.params;
    
    if (!['ScaleUp Blitz', 'ScaleUp Ignite', 'Both'].includes(eventName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event name'
      });
    }

    const registrations = await Registration.find({
      status: 'confirmed',
      interestedEvents: eventName
    });

    const branchDistribution = {};
    const yearDistribution = {};

    registrations.forEach(reg => {
      // Branch distribution
      if (!branchDistribution[reg.branch]) {
        branchDistribution[reg.branch] = 0;
      }
      branchDistribution[reg.branch]++;

      // Year distribution
      if (!yearDistribution[reg.year]) {
        yearDistribution[reg.year] = 0;
      }
      yearDistribution[reg.year]++;
    });

    res.status(200).json({
      success: true,
      data: {
        event: eventName,
        totalRegistrations: registrations.length,
        branchDistribution: Object.entries(branchDistribution)
          .map(([branch, count]) => ({ branch, count }))
          .sort((a, b) => b.count - a.count),
        yearDistribution: Object.entries(yearDistribution)
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => a.year.localeCompare(b.year))
      }
    });

  } catch (error) {
    console.error('Event stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event statistics'
    });
  }
};

// Get live count for display
exports.getLiveCount = async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments({ status: 'confirmed' });
    
    const eventCounts = await Registration.aggregate([
      { $match: { status: 'confirmed' } },
      { $unwind: '$interestedEvents' },
      { 
        $group: {
          _id: '$interestedEvents',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      total: totalRegistrations,
      blitz: 0,
      ignite: 0,
      both: 0
    };

    eventCounts.forEach(item => {
      if (item._id === 'ScaleUp Blitz') counts.blitz = item.count;
      if (item._id === 'ScaleUp Ignite') counts.ignite = item.count;
      if (item._id === 'Both') counts.both = item.count;
    });

    res.status(200).json({
      success: true,
      data: counts
    });

  } catch (error) {
    console.error('Live count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live count'
    });
  }
};
