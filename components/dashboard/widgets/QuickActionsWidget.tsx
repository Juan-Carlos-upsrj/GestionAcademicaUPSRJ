import React, { useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import Button from '../../common/Button';
import Icon from '../../icons/Icon';
import { syncAttendanceData } from '../../../services/syncService';

const QuickActionsWidget: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    return (
        <div className="flex flex-col gap-3 h-full justify-center px-4">
            <Button
                onClick={() => syncAttendanceData(state, dispatch, 'today')}
                variant="primary"
                size="md"
                className="w-full shadow-lg"
            >
                <Icon name="upload-cloud" className="w-5 h-5" />
                <span className="truncate font-black">Sincronizar Hoy</span>
            </Button>
        </div>
    );
};

export default QuickActionsWidget;
